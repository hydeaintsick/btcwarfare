import express, { Response } from "express";
import { ethers } from "ethers";
import User from "../models/User";
import Transaction from "../models/Transaction";
import blockchainService from "../services/blockchainService";
import depositService from "../services/depositService";

const router = express.Router();

/**
 * GET /api/guaranteetx/:key
 * Endpoint privé pour garantir que toutes les transactions des 24 dernières heures sont embasées
 *
 * SÉCURITÉ: Requiert une clé API privée en variable d'env PRIVATE_API_KEY
 *
 * Fonctionnement:
 * 1. Vérifie la clé API
 * 2. Scanne la blockchain pour les transactions des 24 dernières heures
 * 3. Compare avec ce qui est en base
 * 4. Embase les transactions manquantes
 *
 * Usage: À appeler toutes les minutes via un service de cron externe
 */
router.get("/guaranteetx/:key", async (req, res: Response) => {
  try {
    // VALIDATION: Vérifier la clé API
    const providedKey = req.params.key;
    const privateApiKey = process.env.PRIVATE_API_KEY;

    if (!privateApiKey) {
      console.error(
        "[GUARANTEE] PRIVATE_API_KEY not configured in environment variables"
      );
      res.status(500).json({
        success: false,
        error: "Private API key not configured on server",
      });
      return;
    }

    if (providedKey !== privateApiKey) {
      console.warn(
        `[GUARANTEE] Unauthorized access attempt with key: ${providedKey.substring(
          0,
          10
        )}...`
      );
      res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid API key",
      });
      return;
    }

    console.log(
      "[GUARANTEE] Starting transaction guarantee scan for last 24 hours..."
    );

    // Récupérer l'adresse de dépôt
    const depositAddress = await blockchainService.getDepositAddress();

    // Obtenir le provider
    const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
    if (!rpcUrl) {
      res.status(500).json({
        success: false,
        error: "RPC_URL not configured. Cannot scan blockchain.",
      });
      return;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const currentBlock = await provider.getBlockNumber();

    // Calculer le block number d'il y a 24 heures
    // Ethereum ~12 secondes par block, donc ~7200 blocks par jour
    // On prend une marge de sécurité de 8000 blocks
    const blocksPerDay = 8000; // Marge de sécurité pour couvrir les 24h
    const fromBlock = Math.max(0, currentBlock - blocksPerDay);

    console.log(
      `[GUARANTEE] Scanning blocks ${fromBlock} to ${currentBlock} (last 24 hours)`
    );

    const report = {
      startTime: new Date().toISOString(),
      endTime: "" as string,
      fromBlock,
      toBlock: currentBlock,
      scannedBlocks: currentBlock - fromBlock,
      depositsFound: {
        eth: [] as any[],
        usdt: [] as any[],
      },
      depositsProcessed: {
        eth: 0,
        usdt: 0,
      },
      depositsSkipped: {
        alreadyProcessed: 0,
        noUser: 0,
        invalid: 0,
      },
      errors: [] as string[],
    };

    // Scanner les transactions ETH
    try {
      console.log("[GUARANTEE] Scanning ETH transactions...");

      // Pour ETH, on doit scanner block par block (moins efficace mais nécessaire)
      // On limite à 100 blocks par appel pour éviter les timeouts
      const maxBlocksToScan = 100;
      const actualFromBlock = Math.max(
        fromBlock,
        currentBlock - maxBlocksToScan
      );

      for (
        let blockNum = currentBlock;
        blockNum >= actualFromBlock;
        blockNum--
      ) {
        try {
          const block = await provider.getBlock(blockNum, true);
          if (!block || !block.transactions) continue;

          for (const txHash of block.transactions) {
            try {
              const tx =
                typeof txHash === "string"
                  ? await provider.getTransaction(txHash)
                  : txHash;

              if (
                !tx ||
                !tx.to ||
                tx.to.toLowerCase() !== depositAddress.toLowerCase()
              ) {
                continue;
              }

              // Vérifier si cette transaction a déjà été traitée
              const existingTx = await Transaction.findOne({ txHash: tx.hash });
              if (existingTx) {
                report.depositsSkipped.alreadyProcessed++;
                continue;
              }

              // Vérifier que la transaction est confirmée
              const receipt = await provider.getTransactionReceipt(tx.hash);
              if (!receipt || receipt.status !== 1) {
                report.depositsSkipped.invalid++;
                continue;
              }

              // Trouver l'utilisateur par son adresse wallet
              const user = await User.findOne({
                walletAddress: tx.from.toLowerCase(),
              });

              if (!user) {
                report.depositsSkipped.noUser++;
                continue;
              }

              // Montant de la transaction
              const amount = parseFloat(ethers.formatEther(tx.value || 0));

              if (amount === 0) {
                report.depositsSkipped.invalid++;
                continue;
              }

              // Ajouter au rapport
              report.depositsFound.eth.push({
                txHash: tx.hash,
                from: tx.from,
                amount,
                blockNumber: blockNum,
                timestamp: new Date(block.timestamp * 1000).toISOString(),
              });

              // Traiter le dépôt (utiliser version sécurisée)
              const result = await depositService.processDepositSecure(
                user,
                tx.hash,
                "ETH",
                amount
              );
              if (result.success) {
                report.depositsProcessed.eth++;
                console.log(
                  `✅ [GUARANTEE] Processed ETH deposit: ${tx.hash} (${amount} ETH)`
                );
              } else {
                report.errors.push(
                  `Failed to process ETH tx ${tx.hash}: ${result.message}`
                );
                console.error(
                  `❌ [GUARANTEE] Failed to process ETH deposit: ${tx.hash}`,
                  result.message
                );
              }
            } catch (error: any) {
              report.errors.push(`Error processing ETH tx: ${error.message}`);
              console.error(
                `[GUARANTEE] Error processing ETH transaction:`,
                error
              );
            }
          }
        } catch (error: any) {
          report.errors.push(
            `Error scanning block ${blockNum}: ${error.message}`
          );
          console.error(`[GUARANTEE] Error scanning block ${blockNum}:`, error);
        }
      }
    } catch (error: any) {
      report.errors.push(`Error scanning ETH deposits: ${error.message}`);
      console.error("[GUARANTEE] Error scanning ETH deposits:", error);
    }

    // Scanner les transactions USDT (ERC20)
    try {
      console.log("[GUARANTEE] Scanning USDT transactions...");

      const USDT_CONTRACT_ADDRESS_MAINNET =
        "0xdAC17F958D2ee523a2206206994597C13D831ec7";
      const network = await provider.getNetwork();
      const usdtAddress =
        network.chainId === 1n ? USDT_CONTRACT_ADDRESS_MAINNET : "0x..."; // Sepolia address si nécessaire

      // ABI pour l'événement Transfer
      const transferAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ];

      const contract = new ethers.Contract(usdtAddress, transferAbi, provider);

      // Récupérer les événements Transfer vers l'adresse de dépôt
      const filter = contract.filters.Transfer(null, depositAddress);
      const events = await contract.queryFilter(
        filter,
        fromBlock,
        currentBlock
      );

      for (const event of events) {
        try {
          // Vérifier que l'événement a été parsé et contient args
          if (!("args" in event) || !event.args) {
            continue;
          }

          const txHash = event.transactionHash;
          const from = event.args[0].toLowerCase();
          const value = event.args[2];

          // Vérifier si cette transaction a déjà été traitée
          const existingTx = await Transaction.findOne({ txHash });
          if (existingTx) {
            report.depositsSkipped.alreadyProcessed++;
            continue;
          }

          // Trouver l'utilisateur
          const user = await User.findOne({ walletAddress: from });
          if (!user) {
            report.depositsSkipped.noUser++;
            continue;
          }

          // Montant en USDT (6 décimales)
          const amount = parseFloat(ethers.formatUnits(value, 6));

          if (amount === 0) {
            report.depositsSkipped.invalid++;
            continue;
          }

          // Vérifier que la transaction est confirmée
          const receipt = await provider.getTransactionReceipt(txHash);
          if (!receipt || receipt.status !== 1) {
            report.depositsSkipped.invalid++;
            continue;
          }

          // Récupérer les infos du block pour le timestamp
          const block = await provider.getBlock(receipt.blockNumber);

          // Ajouter au rapport
          report.depositsFound.usdt.push({
            txHash,
            from,
            amount,
            blockNumber: receipt.blockNumber,
            timestamp: block
              ? new Date(block.timestamp * 1000).toISOString()
              : "unknown",
          });

          // Traiter le dépôt (utiliser version sécurisée)
          const result = await depositService.processDepositSecure(
            user,
            txHash,
            "USDT",
            amount
          );
          if (result.success) {
            report.depositsProcessed.usdt++;
            console.log(
              `✅ [GUARANTEE] Processed USDT deposit: ${txHash} (${amount} USDT)`
            );
          } else {
            report.errors.push(
              `Failed to process USDT tx ${txHash}: ${result.message}`
            );
            console.error(
              `❌ [GUARANTEE] Failed to process USDT deposit: ${txHash}`,
              result.message
            );
          }
        } catch (error: any) {
          report.errors.push(`Error processing USDT tx: ${error.message}`);
          console.error(
            `[GUARANTEE] Error processing USDT transaction ${event.transactionHash}:`,
            error
          );
        }
      }
    } catch (error: any) {
      report.errors.push(`Error scanning USDT deposits: ${error.message}`);
      console.error("[GUARANTEE] Error scanning USDT deposits:", error);
    }

    report.endTime = new Date().toISOString();
    const totalProcessed =
      report.depositsProcessed.eth + report.depositsProcessed.usdt;
    const totalFound =
      report.depositsFound.eth.length + report.depositsFound.usdt.length;

    console.log(
      `[GUARANTEE] Scan completed: ${totalProcessed} deposits processed, ${totalFound} found, ${report.depositsSkipped.alreadyProcessed} already processed`
    );

    res.json({
      success: true,
      message: `Scan completed. Processed ${totalProcessed} new deposits.`,
      report,
    });
  } catch (error: any) {
    console.error("[GUARANTEE] Error in guarantee endpoint:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;
