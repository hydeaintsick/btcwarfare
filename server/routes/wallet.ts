import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Transaction from '../models/Transaction';
import blockchainService from '../services/blockchainService';

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
    const address = blockchainService.getDepositAddress();
    
    res.json({
      address,
      message: 'Send ETH or USDT to this address. Platform fee: 10%.',
      fee: '10%',
    });
  } catch (error) {
    console.error('Deposit address error:', error);
    res.status(500).json({ error: 'Failed to get deposit address' });
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

    // Vérifier la transaction sur la blockchain
    const result = await blockchainService.checkDeposit(
      txHash,
      user.walletAddress,
      currency
    );

    if (!result.confirmed) {
      res.status(400).json({ error: 'Transaction not found or not confirmed' });
      return;
    }

    if (!result.isDeposit || !result.amount) {
      res.json({
        status: 'failed',
        message: 'Transaction is not a valid deposit to platform address',
      });
      return;
    }

    // Calculer les montants avec 10% de frais
    const platformFee = result.amount * 0.1;
    const userAmount = result.amount * 0.9;

    // Créer la transaction en DB
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'deposit',
      amount: userAmount, // Montant crédité à l'utilisateur
      currency,
      txHash,
      status: 'pending',
      feeAmount: platformFee,
    });

    // Créer aussi la transaction pour la commission plateforme
    await Transaction.create({
      userId: user._id,
      type: 'fee',
      amount: platformFee,
      currency,
      txHash,
      status: 'completed',
    });

    // Mettre à jour le balance de l'utilisateur
    if (currency === 'ETH') {
      user.balanceETH += userAmount;
    } else {
      user.balanceUSDT += userAmount;
    }
    await user.save();

    // Marquer la transaction comme complétée
    transaction.status = 'completed';
    await transaction.save();

    res.json({
      status: 'completed',
      amount: userAmount,
      fee: platformFee,
      total: result.amount,
      currency,
      newBalance: currency === 'ETH' ? user.balanceETH : user.balanceUSDT,
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

export default router;

