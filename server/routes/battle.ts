import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Queue from '../models/Queue';
import Battle from '../models/Battle';
import User from '../models/User';
import matchingService from '../services/matchingService';
import battleService from '../services/battleService';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

const MVP_STAKE_AMOUNT = 0.0015; // 0.0015 ETH ou équivalent USDT

/**
 * POST /api/battle/enter
 * Entrer dans la queue pour une battle
 */
router.post('/enter', async (req: AuthRequest, res: Response) => {
  try {
    const { position, currency } = req.body;

    if (!position || !['long', 'short'].includes(position)) {
      res.status(400).json({ error: 'Invalid position. Must be "long" or "short"' });
      return;
    }

    if (!currency || !['ETH', 'USDT'].includes(currency)) {
      res.status(400).json({ error: 'Invalid currency. Must be "ETH" or "USDT"' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Vérifier que l'utilisateur n'est pas déjà dans une queue
    const existingQueue = await Queue.findOne({ userId: user._id });
    if (existingQueue) {
      res.status(400).json({ error: 'User already in queue' });
      return;
    }

    // Vérifier que l'utilisateur a assez de fonds
    const balance = currency === 'ETH' ? user.balanceETH : user.balanceUSDT;
    if (balance < MVP_STAKE_AMOUNT) {
      res.status(400).json({
        error: 'Insufficient balance',
        required: MVP_STAKE_AMOUNT,
        current: balance,
        currency,
      });
      return;
    }

    // Créer l'entrée dans la queue
    const queue = await Queue.create({
      userId: user._id,
      position: position as 'long' | 'short',
      stakeAmount: MVP_STAKE_AMOUNT,
      currency: currency as 'ETH' | 'USDT',
    });

    // Essayer de matcher immédiatement
    const battle = await matchingService.matchPlayers();

    if (battle) {
      // Battle créée, mettre à jour le prix de départ
      await battleService.updateBattleStartPrice(battle._id);

      res.json({
        message: 'Battle created',
        battleId: battle._id,
        battle: {
          id: battle._id,
          longPlayer: battle.longPlayer,
          shortPlayer: battle.shortPlayer,
          startPrice: battle.startPrice,
          startTime: battle.startTime,
          stakeAmount: battle.stakeAmount,
          currency: battle.currency,
        },
      });
    } else {
      // Pas de match, utilisateur en queue
      res.json({
        message: 'Waiting for opponent',
        queueId: queue._id,
        position,
      });
    }
  } catch (error) {
    console.error('Enter battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/battle/current
 * Récupère la battle en cours de l'utilisateur
 */
router.get('/current', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const battle = await Battle.findOne({
      status: 'active',
      $or: [
        { longPlayer: user._id },
        { shortPlayer: user._id },
      ],
    })
      .populate('longPlayer', 'walletAddress')
      .populate('shortPlayer', 'walletAddress');

    if (!battle) {
      res.json({ battle: null });
      return;
    }

    // Récupérer le prix actuel
    const priceData = await battleService.updateBattleStartPrice(battle._id);
    
    res.json({
      battle: {
        id: battle._id,
        longPlayer: {
          id: battle.longPlayer._id,
          address: (battle.longPlayer as any).walletAddress,
        },
        shortPlayer: {
          id: battle.shortPlayer._id,
          address: (battle.shortPlayer as any).walletAddress,
        },
        startPrice: battle.startPrice,
        startTime: battle.startTime,
        stakeAmount: battle.stakeAmount,
        currency: battle.currency,
        status: battle.status,
      },
    });
  } catch (error) {
    console.error('Get current battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/battle/history
 * Historique des battles de l'utilisateur
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const battles = await Battle.find({
      $or: [
        { longPlayer: user._id },
        { shortPlayer: user._id },
      ],
    })
      .populate('longPlayer', 'walletAddress')
      .populate('shortPlayer', 'walletAddress')
      .populate('winner', 'walletAddress')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      battles: battles.map((battle) => ({
        id: battle._id,
        longPlayer: {
          id: battle.longPlayer._id,
          address: (battle.longPlayer as any).walletAddress,
        },
        shortPlayer: {
          id: battle.shortPlayer._id,
          address: (battle.shortPlayer as any).walletAddress,
        },
        startPrice: battle.startPrice,
        startTime: battle.startTime,
        stakeAmount: battle.stakeAmount,
        currency: battle.currency,
        status: battle.status,
        winner: battle.winner
          ? {
              id: (battle.winner as any)._id,
              address: (battle.winner as any).walletAddress,
            }
          : null,
        resolvedAt: battle.resolvedAt,
        createdAt: battle.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get battle history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/battle/resolve/:id
 * Résout une battle manuellement
 */
router.post('/resolve/:id', async (req: AuthRequest, res: Response) => {
  try {
    const battleId = req.params.id;
    const user = await User.findById(req.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const battle = await Battle.findById(battleId);
    if (!battle) {
      res.status(404).json({ error: 'Battle not found' });
      return;
    }

    // Vérifier que l'utilisateur fait partie de la battle
    if (
      battle.longPlayer.toString() !== user._id.toString() &&
      battle.shortPlayer.toString() !== user._id.toString()
    ) {
      res.status(403).json({ error: 'Not authorized to resolve this battle' });
      return;
    }

    const resolved = await battleService.resolveBattle(battle._id);
    
    if (!resolved) {
      res.status(400).json({ error: 'Battle cannot be resolved yet or already resolved' });
      return;
    }

    // Récupérer la battle mise à jour
    const updatedBattle = await Battle.findById(battleId)
      .populate('longPlayer', 'walletAddress')
      .populate('shortPlayer', 'walletAddress')
      .populate('winner', 'walletAddress');

    res.json({
      message: 'Battle resolved',
      battle: {
        id: updatedBattle!._id,
        winner: {
          id: updatedBattle!.winner?._id,
          address: (updatedBattle!.winner as any)?.walletAddress,
        },
        status: updatedBattle!.status,
        resolvedAt: updatedBattle!.resolvedAt,
      },
    });
  } catch (error) {
    console.error('Resolve battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

