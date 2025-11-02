import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Transaction from '../models/Transaction';
import blockchainService from '../services/blockchainService';
import depositService from '../services/depositService';

const router = express.Router();

// Tous les routes nécessitent une authentification
router.use(authenticate);

/**
 * GET /api/wallet/balance
 * Récupère la balance de l'utilisateur
 */
router.get('/balance', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      balanceETH: user.balanceETH,
      balanceUSDT: user.balanceUSDT,
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wallet/deposit-address
 * Retourne l'adresse de dépôt pour ETH et USDT
 */
router.get('/deposit-address', async (req: AuthRequest, res: Response) => {
  try {
    const address = await blockchainService.getDepositAddress();
    
    res.json({
      address,
      message: 'Send ETH or USDT to this address. Platform fee: 5%.',
      fee: '5%',
    });
  } catch (error: any) {
    console.error('Deposit address error:', error);
    // Si le wallet n'est pas configuré, retourner un message d'erreur clair
    if (error.message?.includes('Platform wallet not configured')) {
      res.status(500).json({ 
        error: 'Platform wallet not configured. Please set PLATFORM_PRIVATE_KEY in environment variables.',
        address: '0x0000000000000000000000000000000000000000', // Address placeholder
      });
    } else {
      res.status(500).json({ error: 'Failed to get deposit address' });
    }
  }
});

/**
 * POST /api/wallet/check-deposit
 * Vérifie manuellement un dépôt
 */
router.post('/check-deposit', async (req: AuthRequest, res: Response) => {
  try {
    const { txHash, currency } = req.body;

    if (!txHash || !currency || !['ETH', 'USDT'].includes(currency)) {
      res.status(400).json({ error: 'Missing or invalid txHash or currency' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Vérifier si la transaction existe déjà
    const existingTx = await Transaction.findOne({ txHash, userId: user._id });
    if (existingTx) {
      res.json({
        status: existingTx.status,
        message: existingTx.status === 'completed' 
          ? 'Deposit already processed' 
          : 'Transaction found but not yet processed',
      });
      return;
    }

    // Utiliser le service de dépôt pour vérifier et traiter
    const result = await depositService.checkTransactionForUser(
      user._id.toString(),
      txHash,
      currency
    );

    if (!result.found) {
      res.status(400).json({ error: result.message || 'Transaction not found or invalid' });
      return;
    }

    // Récupérer la transaction créée pour obtenir les détails complets
    const transaction = await Transaction.findOne({ txHash, userId: user._id });
    const updatedUser = await User.findById(user._id);

    res.json({
      status: result.status || 'completed',
      amount: result.amount || transaction?.amount || 0,
      fee: transaction?.feeAmount || 0,
      total: (result.amount || 0) + (transaction?.feeAmount || 0),
      currency,
      newBalance: currency === 'ETH' 
        ? (updatedUser?.balanceETH || user.balanceETH)
        : (updatedUser?.balanceUSDT || user.balanceUSDT),
    });
  } catch (error) {
    console.error('Check deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wallet/deposits
 * Historique des dépôts de l'utilisateur
 */
router.get('/deposits', async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'deposit',
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      deposits: transactions.map((tx) => ({
        id: tx._id,
        amount: tx.amount,
        currency: tx.currency,
        fee: tx.feeAmount,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt,
      })),
    });
  } catch (error) {
    console.error('Deposits history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallet/withdraw
 * Créer une demande de retrait
 */
router.post('/withdraw', async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency, destinationAddress } = req.body;

    if (!amount || !currency || !destinationAddress) {
      res.status(400).json({ error: 'Missing required fields: amount, currency, destinationAddress' });
      return;
    }

    if (!['ETH', 'USDT'].includes(currency)) {
      res.status(400).json({ error: 'Invalid currency. Must be ETH or USDT' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Vérifier la balance
    const balance = currency === 'ETH' ? user.balanceETH : user.balanceUSDT;
    
    // Calculer les frais de 5% sur le retrait
    const withdrawalFee = amount * 0.05;
    const totalRequired = amount + withdrawalFee;

    if (balance < totalRequired) {
      res.status(400).json({
        error: 'Insufficient balance',
        required: totalRequired,
        current: balance,
        fee: withdrawalFee,
      });
      return;
    }

    // Débiter le compte utilisateur
    if (currency === 'ETH') {
      user.balanceETH -= totalRequired;
    } else {
      user.balanceUSDT -= totalRequired;
    }
    await user.save();

    // Créer la transaction de retrait
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'withdrawal',
      amount: amount, // Montant que l'utilisateur recevra
      currency,
      status: 'pending',
      feeAmount: withdrawalFee,
      txHash: destinationAddress, // On stocke l'adresse de destination ici temporairement
    });

    // Créer la transaction de frais pour la plateforme
    await Transaction.create({
      userId: user._id,
      type: 'fee',
      amount: withdrawalFee,
      currency,
      status: 'completed',
    });

    res.json({
      message: 'Withdrawal request created',
      transactionId: transaction._id,
      amount,
      fee: withdrawalFee,
      total: totalRequired,
      currency,
      newBalance: currency === 'ETH' ? user.balanceETH : user.balanceUSDT,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wallet/pending-deposits
 * Récupère les dépôts en attente de l'utilisateur (pour monitoring)
 */
router.get('/pending-deposits', async (req: AuthRequest, res: Response) => {
  try {
    // Récupérer les transactions de dépôt en attente ou récentes (dernières 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const pendingTransactions = await Transaction.find({
      userId: req.userId,
      type: 'deposit',
      createdAt: { $gte: oneDayAgo },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      deposits: pendingTransactions.map((tx) => ({
        id: tx._id,
        txHash: tx.txHash,
        amount: tx.amount,
        currency: tx.currency,
        fee: tx.feeAmount,
        status: tx.status,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Pending deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wallet/transactions
 * Historique complet des transactions de l'utilisateur
 */
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('relatedBattleId', 'startPrice startTime');

    res.json({
      transactions: transactions.map((tx) => ({
        id: tx._id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency,
        fee: tx.feeAmount,
        status: tx.status,
        txHash: tx.txHash,
        relatedBattleId: tx.relatedBattleId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Transactions history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallet/initiate-topup
 * Initialise un topup (retourne l'adresse de dépôt et les détails)
 * SÉCURITÉ: Valide seulement le montant, ne crédite rien
 */
router.post('/initiate-topup', async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency } = req.body;

    // VALIDATION: Vérifier les paramètres
    if (!amount || !currency || !['ETH', 'USDT'].includes(currency)) {
      res.status(400).json({ error: 'Missing or invalid amount or currency' });
      return;
    }

    if (amount <= 0 || amount > 1000) {
      res.status(400).json({ error: 'Amount must be between 0 and 1000' });
      return;
    }

    // VALIDATION: Vérifier que l'utilisateur existe
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Récupérer l'adresse de dépôt
    const depositAddress = await blockchainService.getDepositAddress();
    
    // Calculer les frais et montant après frais
    const fee = amount * 0.05;
    const amountAfterFee = amount * (1 - 0.05);

    // Log pour audit
    console.log(`[SECURITY] Topup initiated: userId=${req.userId}, amount=${amount} ${currency}`);

    res.json({
      depositAddress,
      amount,
      currency,
      fee,
      amountAfterFee,
    });
  } catch (error: any) {
    console.error('Initiate topup error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/wallet/watch-topup
 * Suit le statut d'une transaction de topup
 * SÉCURITÉ: Vérifie la blockchain OBLIGATOIREMENT avant crédit
 */
router.post('/watch-topup', async (req: AuthRequest, res: Response) => {
  try {
    const { txHash, currency } = req.body;

    // VALIDATION: Vérifier les paramètres
    if (!txHash || !currency || !['ETH', 'USDT'].includes(currency)) {
      res.status(400).json({ error: 'Missing or invalid txHash or currency' });
      return;
    }

    // VALIDATION: Vérifier que l'utilisateur existe et correspond
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // VALIDATION: Vérifier si la transaction existe déjà
    const existingTx = await Transaction.findOne({ txHash, userId: req.userId });
    if (existingTx) {
      // Transaction déjà traitée
      const updatedUser = await User.findById(req.userId);
      res.json({
        status: existingTx.status === 'completed' ? 'confirmed' : existingTx.status,
        amount: existingTx.amount + (existingTx.feeAmount || 0), // Montant brut
        fee: existingTx.feeAmount || 0,
        amountAfterFee: existingTx.amount,
        newBalance: currency === 'ETH' 
          ? (updatedUser?.balanceETH || user.balanceETH)
          : (updatedUser?.balanceUSDT || user.balanceUSDT),
      });
      return;
    }

    // SÉCURITÉ CRITIQUE: Utiliser checkTransactionForUser qui fait TOUTES les validations
    const result = await depositService.checkTransactionForUser(
      req.userId,
      txHash,
      currency
    );

    if (!result.found) {
      // Transaction pas encore trouvée ou pas validée
      // Vérifier rapidement sur la blockchain si elle existe
      try {
        let blockchainCheck;
        try {
          blockchainCheck = await blockchainService.checkDeposit(
            txHash,
            user.walletAddress,
            currency
          );
        } catch (blockchainError: any) {
          // Si erreur de provider, retourner une erreur claire
          if (blockchainError.message?.includes('Provider not configured') || 
              blockchainError.message?.includes('RPC_URL')) {
            console.error(`[WATCH-TOPUP] Blockchain provider not configured:`, blockchainError.message);
            res.status(500).json({
              status: 'failed',
              error: 'Blockchain provider not configured on server. Please contact support.',
              message: 'The server cannot verify blockchain transactions. Please set RPC_URL environment variable.',
            });
            return;
          }
          throw blockchainError; // Re-throw si autre erreur
        }

        if (!blockchainCheck.confirmed) {
          res.json({
            status: 'pending',
            message: 'Transaction not yet confirmed on blockchain',
          });
          return;
        }

        if (!blockchainCheck.isDeposit) {
          res.status(400).json({
            status: 'failed',
            error: 'Transaction is not a valid deposit to platform address',
          });
          return;
        }

        // La transaction est confirmée et valide, mais pas encore traitée
        // Retraiter avec checkTransactionForUser pour forcer le traitement
        console.log(`[WATCH-TOPUP] Transaction ${txHash} confirmed on blockchain, forcing processing...`);
        
        try {
          const retryResult = await depositService.checkTransactionForUser(
            req.userId,
            txHash,
            currency
          );

          if (retryResult.found && retryResult.status === 'completed') {
            const updatedUser = await User.findById(req.userId);
            res.json({
              status: 'confirmed',
              amount: retryResult.amount || 0,
              fee: retryResult.fee || 0,
              amountAfterFee: retryResult.amountAfterFee || 0,
              newBalance: currency === 'ETH' 
                ? (updatedUser?.balanceETH || user.balanceETH)
                : (updatedUser?.balanceUSDT || user.balanceUSDT),
            });
            return;
          }

          // Si toujours pas trouvé après retry, attendre un peu
          res.json({
            status: 'pending',
            message: retryResult.message || 'Transaction confirmed, processing...',
          });
          return;
        } catch (processError: any) {
          console.error(`[WATCH-TOPUP] Error processing confirmed transaction:`, processError);
          
          // Si erreur de provider, retourner une erreur claire
          if (processError.message?.includes('Provider not configured') || 
              processError.message?.includes('RPC_URL')) {
            res.status(500).json({
              status: 'failed',
              error: 'Blockchain provider not configured. Please contact support.',
              message: processError.message,
            });
            return;
          }
          
          // Autre erreur, continuer le polling
          res.json({
            status: 'pending',
            message: 'Transaction confirmed, retrying processing...',
          });
          return;
        }
      } catch (error: any) {
        console.error(`[WATCH-TOPUP] Error checking blockchain:`, error);
        // Erreur de vérification blockchain - transaction peut être en attente
        res.json({
          status: 'pending',
          message: 'Waiting for blockchain confirmation',
        });
        return;
      }
    }

    // Transaction trouvée et traitée
    const updatedUser = await User.findById(req.userId);

    res.json({
      status: result.status === 'completed' ? 'confirmed' : result.status,
      amount: result.amount || 0,
      fee: result.fee || 0,
      amountAfterFee: result.amountAfterFee || 0,
      newBalance: currency === 'ETH' 
        ? (updatedUser?.balanceETH || user.balanceETH)
        : (updatedUser?.balanceUSDT || user.balanceUSDT),
    });
  } catch (error: any) {
    console.error('Watch topup error:', error);
    res.status(500).json({ 
      status: 'failed',
      error: error.message || 'Internal server error' 
    });
  }
});

export default router;

