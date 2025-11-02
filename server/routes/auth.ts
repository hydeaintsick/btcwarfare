import express, { Request, Response } from 'express';
import { ethers } from 'ethers';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { generateNonce, verifySignature, createAuthMessage } from '../utils/signature';
import { createToken, authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/challenge
 * Génère un nonce pour l'authentification par signature
 */
router.post('/challenge', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Trouver ou créer l'utilisateur
    let user = await User.findOne({ walletAddress: normalizedAddress });
    
    if (!user) {
      // Créer un nouvel utilisateur
      const nonce = generateNonce();
      user = await User.create({
        walletAddress: normalizedAddress,
        nonce,
        balanceETH: 0,
        balanceUSDT: 0,
      });
    } else {
      // Générer un nouveau nonce
      user.nonce = generateNonce();
      await user.save();
    }

    const message = createAuthMessage(walletAddress, user.nonce);

    res.json({
      message,
      nonce: user.nonce,
    });
  } catch (error) {
    console.error('Challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/verify
 * Vérifie la signature et authentifie l'utilisateur
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      res.status(400).json({ error: 'Missing wallet address or signature' });
      return;
    }

    if (!ethers.isAddress(walletAddress)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Récupérer l'utilisateur
    const user = await User.findOne({ walletAddress: normalizedAddress });
    if (!user) {
      res.status(404).json({ error: 'User not found. Please request a challenge first.' });
      return;
    }

    // Créer le message avec le nonce
    const message = createAuthMessage(walletAddress, user.nonce);

    // Vérifier la signature
    const isValid = verifySignature(message, signature, walletAddress);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Générer un nouveau nonce pour la prochaine authentification
    user.nonce = generateNonce();
    await user.save();

    // Créer un token JWT
    const token = createToken(user._id.toString());

    // Calculer le solde dynamiquement à partir des transactions
    const completedTransactions = await Transaction.find({
      userId: user._id,
      status: 'completed',
    });

    // Récupérer aussi les withdrawals pending pour les soustraire du solde disponible
    const pendingWithdrawals = await Transaction.find({
      userId: user._id,
      type: 'withdrawal',
      status: 'pending',
    });

    let balanceETH = 0;
    let balanceUSDT = 0;

    // Calculer le solde à partir des transactions complétées
    for (const tx of completedTransactions) {
      const amount = tx.amount || 0;
      const feeAmount = tx.feeAmount || 0;
      
      if (tx.currency === 'ETH') {
        if (tx.type === 'deposit') {
          balanceETH += amount;
        } else if (tx.type === 'win') {
          balanceETH += amount;
        } else if (tx.type === 'withdrawal') {
          // Les retraits débitent le montant total (amount contient déjà les frais)
          balanceETH -= amount;
        } else if (tx.type === 'stake') {
          balanceETH -= (amount + feeAmount);
        }
      } else if (tx.currency === 'USDT') {
        if (tx.type === 'deposit') {
          balanceUSDT += amount;
        } else if (tx.type === 'win') {
          balanceUSDT += amount;
        } else if (tx.type === 'withdrawal') {
          // Les retraits débitent le montant total (amount contient déjà les frais)
          balanceUSDT -= amount;
        } else if (tx.type === 'stake') {
          balanceUSDT -= (amount + feeAmount);
        }
      }
    }

    // Soustraire les withdrawals pending du solde disponible
    for (const withdrawal of pendingWithdrawals) {
      const amount = withdrawal.amount || 0;
      if (withdrawal.currency === 'ETH') {
        balanceETH -= amount;
      } else if (withdrawal.currency === 'USDT') {
        balanceUSDT -= amount;
      }
    }

    balanceETH = Math.max(0, balanceETH);
    balanceUSDT = Math.max(0, balanceUSDT);

    res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        balanceETH,
        balanceUSDT,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Récupère les informations de l'utilisateur connecté
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculer le solde dynamiquement à partir des transactions
    const completedTransactions = await Transaction.find({
      userId: req.userId,
      status: 'completed',
    });

    // Récupérer aussi les withdrawals pending pour les soustraire du solde disponible
    const pendingWithdrawals = await Transaction.find({
      userId: req.userId,
      type: 'withdrawal',
      status: 'pending',
    });

    let balanceETH = 0;
    let balanceUSDT = 0;

    // Calculer le solde à partir des transactions complétées
    for (const tx of completedTransactions) {
      const amount = tx.amount || 0;
      const feeAmount = tx.feeAmount || 0;
      
      if (tx.currency === 'ETH') {
        if (tx.type === 'deposit') {
          balanceETH += amount;
        } else if (tx.type === 'win') {
          balanceETH += amount;
        } else if (tx.type === 'withdrawal') {
          // Les retraits débitent le montant total (amount contient déjà les frais)
          balanceETH -= amount;
        } else if (tx.type === 'stake') {
          balanceETH -= (amount + feeAmount);
        }
      } else if (tx.currency === 'USDT') {
        if (tx.type === 'deposit') {
          balanceUSDT += amount;
        } else if (tx.type === 'win') {
          balanceUSDT += amount;
        } else if (tx.type === 'withdrawal') {
          // Les retraits débitent le montant total (amount contient déjà les frais)
          balanceUSDT -= amount;
        } else if (tx.type === 'stake') {
          balanceUSDT -= (amount + feeAmount);
        }
      }
    }

    // Soustraire les withdrawals pending du solde disponible
    for (const withdrawal of pendingWithdrawals) {
      const amount = withdrawal.amount || 0;
      if (withdrawal.currency === 'ETH') {
        balanceETH -= amount;
      } else if (withdrawal.currency === 'USDT') {
        balanceUSDT -= amount;
      }
    }

    balanceETH = Math.max(0, balanceETH);
    balanceUSDT = Math.max(0, balanceUSDT);

    res.json({
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        balanceETH,
        balanceUSDT,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

