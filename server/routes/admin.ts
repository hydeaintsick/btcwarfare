import express, { Response } from "express";
import {
  requireAdmin,
  verifyAdminCredentials,
  createAdminToken,
  AdminRequest,
} from "../middleware/adminAuth";
import adminService from "../services/adminService";
import Transaction from "../models/Transaction";
import User from "../models/User";
import blockchainService from "../services/blockchainService";
import { ethers } from "ethers";

const router = express.Router();

/**
 * POST /api/admin/login
 * Connexion admin avec email/mot de passe
 */
router.post("/login", async (req: AdminRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", {
      receivedEmail: email,
      receivedPassword: password ? "***" : "(empty)",
      emailType: typeof email,
      passwordType: typeof password,
    });

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const isValid = verifyAdminCredentials(email, password);
    console.log("verifyAdminCredentials result:", isValid);

    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = createAdminToken(email);

    res.json({
      token,
      email,
      message: "Admin login successful",
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Toutes les autres routes nécessitent l'authentification admin
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard
 * Récupère les KPIs et stats globales du dashboard admin
 */
router.get("/dashboard", async (req: AdminRequest, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

/**
 * GET /api/admin/deposits-chart
 * Récupère les données pour le graphique des dépôts ETH
 * Query params: period (day|week|month)
 */
router.get("/deposits-chart", async (req: AdminRequest, res: Response) => {
  try {
    const period = (req.query.period as "day" | "week" | "month") || "day";
    const chartData = await adminService.getDepositsChartData(period);
    res.json(chartData);
  } catch (error) {
    console.error("Admin deposits chart error:", error);
    res.status(500).json({ error: "Failed to fetch deposits chart data" });
  }
});

/**
 * GET /api/admin/transactions
 * Récupère la liste de toutes les transactions avec filtres optionnels
 * Query params: type, status, currency, limit, offset
 */
router.get("/transactions", async (req: AdminRequest, res: Response) => {
  try {
    const { type, status, currency, limit = "100", offset = "0" } = req.query;

    const query: any = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (currency) query.currency = currency;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .populate("userId", "walletAddress")
      .populate("relatedBattleId", "startPrice startTime");

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map((tx) => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        fee: tx.feeAmount,
        status: tx.status,
        txHash: tx.txHash,
        userId: tx.userId,
        relatedBattleId: tx.relatedBattleId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })),
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error("Admin transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/**
 * GET /api/admin/withdrawals
 * Récupère la liste des demandes de retrait en attente (ETH uniquement)
 */
router.get("/withdrawals", async (req: AdminRequest, res: Response) => {
  try {
    const withdrawals = await Transaction.find({
      type: "withdrawal",
      currency: "ETH", // ETH uniquement
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .populate("userId", "walletAddress");

    res.json({
      withdrawals: withdrawals.map((tx) => ({
        id: tx._id,
        userId: tx.userId,
        amount: tx.amount,
        currency: tx.currency,
        fee: tx.feeAmount,
        status: tx.status,
        destinationAddress: tx.txHash, // Dans les retraits, txHash contient l'adresse de destination
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Admin withdrawals error:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

/**
 * POST /api/admin/withdrawals/:id/approve
 * Approuve un retrait et l'exécute sur la blockchain
 */
router.post(
  "/withdrawals/:id/approve",
  async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;

      const withdrawal = await Transaction.findById(id).populate(
        "userId",
        "walletAddress"
      );

      if (!withdrawal) {
        res.status(404).json({ error: "Withdrawal not found" });
        return;
      }

      if (withdrawal.status !== "pending") {
        res
          .status(400)
          .json({ error: `Withdrawal already ${withdrawal.status}` });
        return;
      }

      if (withdrawal.currency !== "ETH") {
        res.status(400).json({ error: "Only ETH withdrawals are supported" });
        return;
      }

      // Vérifier que l'adresse de destination est valide
      const destinationAddress = withdrawal.txHash; // Dans les retraits, txHash contient l'adresse de destination
      if (!destinationAddress || !ethers.isAddress(destinationAddress)) {
        res.status(400).json({ error: "Invalid destination address" });
        return;
      }

      // Calculer le montant total débité et le montant net à envoyer
      // amount contient maintenant le montant total débité (incluant les frais)
      const totalAmount = withdrawal.amount || 0;
      const fee = withdrawal.feeAmount || 0;
      const userAmount = totalAmount - fee; // Montant net que l'utilisateur recevra

      // Exécuter le retrait sur la blockchain
      try {
        // Vérifier que le provider est configuré
        blockchainService.getDepositAddressSync(); // Vérifie la configuration

        // Créer un wallet pour la plateforme
        const privateKey = process.env.PLATFORM_PRIVATE_KEY;
        if (!privateKey) {
          throw new Error("PLATFORM_PRIVATE_KEY not configured");
        }

        const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
        if (!rpcUrl) {
          throw new Error("RPC_URL not configured");
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const platformWallet = new ethers.Wallet(privateKey, provider);

        // Vérifier le solde disponible
        const balance = await provider.getBalance(platformWallet.address);
        const balanceETH = parseFloat(ethers.formatEther(balance));

        if (balanceETH < totalAmount) {
          res.status(400).json({
            error: "Insufficient platform balance",
            required: totalAmount,
            available: balanceETH,
          });
          return;
        }

        // Envoyer la transaction (envoyer le montant net à l'utilisateur, les frais restent sur la plateforme)
        const tx = await platformWallet.sendTransaction({
          to: destinationAddress,
          value: ethers.parseEther(userAmount.toString()),
        });

        // Attendre la confirmation
        await tx.wait();

        // Mettre à jour le statut du retrait
        withdrawal.status = "completed";
        withdrawal.txHash = tx.hash; // Stocker le hash de la transaction
        await withdrawal.save();

        res.json({
          message: "Withdrawal approved and executed",
          transactionId: withdrawal._id,
          txHash: tx.hash,
          amount: userAmount,
          fee,
          total: totalAmount,
          currency: withdrawal.currency,
        });
      } catch (blockchainError: any) {
        console.error("Blockchain error during withdrawal:", blockchainError);
        res.status(500).json({
          error: "Failed to execute withdrawal on blockchain",
          message: blockchainError.message,
        });
      }
    } catch (error: any) {
      console.error("Admin approve withdrawal error:", error);
      res.status(500).json({
        error: "Failed to approve withdrawal",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/admin/withdrawals/:id/reject
 * Rejette un retrait
 */
router.post(
  "/withdrawals/:id/reject",
  async (req: AdminRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const withdrawal = await Transaction.findById(id).populate(
        "userId",
        "walletAddress"
      );

      if (!withdrawal) {
        res.status(404).json({ error: "Withdrawal not found" });
        return;
      }

      if (withdrawal.status !== "pending") {
        res
          .status(400)
          .json({ error: `Withdrawal already ${withdrawal.status}` });
        return;
      }

      // Restaurer le balance de l'utilisateur (rembourser le montant débité)
      // amount contient maintenant le montant total débité (incluant les frais)
      const userId = withdrawal.userId as any;
      const user = await User.findById(userId);

      if (user) {
        const totalAmount = withdrawal.amount || 0; // Montant total débité (incluant les frais)

        if (withdrawal.currency === "ETH") {
          const currentBalance = Number(user.balanceETH) || 0;
          user.balanceETH = currentBalance + totalAmount;
        } else {
          const currentBalance = Number(user.balanceUSDT) || 0;
          user.balanceUSDT = currentBalance + totalAmount;
        }
        await user.save();
      }

      // Marquer le retrait comme rejected (rejeté par l'admin)
      withdrawal.status = "rejected";
      withdrawal.rejectionReason = reason || "Rejected by admin";
      await withdrawal.save();

      // Trouver et marquer la transaction de fee associée comme refunded
      const feeAmount = withdrawal.feeAmount || 0;
      if (feeAmount > 0) {
        const feeTransaction = await Transaction.findOne({
          userId: withdrawal.userId,
          type: "fee",
          amount: feeAmount,
          currency: withdrawal.currency,
          status: "completed",
          createdAt: {
            $gte: new Date(withdrawal.createdAt.getTime() - 60000), // Dans les 60 secondes après le withdrawal
            $lte: new Date(withdrawal.createdAt.getTime() + 60000),
          },
        }).sort({ createdAt: -1 }); // Prendre la plus récente

        if (feeTransaction) {
          feeTransaction.status = "refunded";
          await feeTransaction.save();
        }
      }

      res.json({
        message: "Withdrawal rejected",
        transactionId: withdrawal._id,
        reason: reason || "Rejected by admin",
      });
    } catch (error: any) {
      console.error("Admin reject withdrawal error:", error);
      res.status(500).json({
        error: "Failed to reject withdrawal",
        message: error.message,
      });
    }
  }
);

export default router;
