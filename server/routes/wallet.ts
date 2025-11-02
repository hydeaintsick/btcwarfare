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

    // Calculer les montants avec 5% de frais
    const platformFee = result.amount * 0.05;
    const userAmount = result.amount * 0.95;

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

export default router;

