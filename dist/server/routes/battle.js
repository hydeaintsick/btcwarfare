"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Queue_1 = __importDefault(require("../models/Queue"));
const Battle_1 = __importDefault(require("../models/Battle"));
const User_1 = __importDefault(require("../models/User"));
const matchingService_1 = __importDefault(require("../services/matchingService"));
const battleService_1 = __importDefault(require("../services/battleService"));
const router = express_1.default.Router();
// Toutes les routes nécessitent une authentification
router.use(auth_1.authenticate);
const MVP_STAKE_AMOUNT = 0.0015; // 0.0015 ETH ou équivalent USDT
/**
 * POST /api/battle/enter
 * Entrer dans la queue pour une battle
 */
router.post('/enter', async (req, res) => {
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
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Vérifier que l'utilisateur n'est pas déjà dans une queue
        const existingQueue = await Queue_1.default.findOne({ userId: user._id });
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
        const queue = await Queue_1.default.create({
            userId: user._id,
            position: position,
            stakeAmount: MVP_STAKE_AMOUNT,
            currency: currency,
        });
        // Essayer de matcher immédiatement
        const battle = await matchingService_1.default.matchPlayers();
        if (battle) {
            // Battle créée, mettre à jour le prix de départ
            await battleService_1.default.updateBattleStartPrice(battle._id);
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
        }
        else {
            // Pas de match, utilisateur en queue
            res.json({
                message: 'Waiting for opponent',
                queueId: queue._id,
                position,
            });
        }
    }
    catch (error) {
        console.error('Enter battle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/battle/current
 * Récupère la battle en cours de l'utilisateur
 */
router.get('/current', async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const battle = await Battle_1.default.findOne({
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
        const priceData = await battleService_1.default.updateBattleStartPrice(battle._id);
        res.json({
            battle: {
                id: battle._id,
                longPlayer: {
                    id: battle.longPlayer._id,
                    address: battle.longPlayer.walletAddress,
                },
                shortPlayer: {
                    id: battle.shortPlayer._id,
                    address: battle.shortPlayer.walletAddress,
                },
                startPrice: battle.startPrice,
                startTime: battle.startTime,
                stakeAmount: battle.stakeAmount,
                currency: battle.currency,
                status: battle.status,
            },
        });
    }
    catch (error) {
        console.error('Get current battle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/battle/history
 * Historique des battles de l'utilisateur
 */
router.get('/history', async (req, res) => {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const battles = await Battle_1.default.find({
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
                    address: battle.longPlayer.walletAddress,
                },
                shortPlayer: {
                    id: battle.shortPlayer._id,
                    address: battle.shortPlayer.walletAddress,
                },
                startPrice: battle.startPrice,
                startTime: battle.startTime,
                stakeAmount: battle.stakeAmount,
                currency: battle.currency,
                status: battle.status,
                winner: battle.winner
                    ? {
                        id: battle.winner._id,
                        address: battle.winner.walletAddress,
                    }
                    : null,
                resolvedAt: battle.resolvedAt,
                createdAt: battle.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Get battle history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/battle/resolve/:id
 * Résout une battle manuellement
 */
router.post('/resolve/:id', async (req, res) => {
    try {
        const battleId = req.params.id;
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const battle = await Battle_1.default.findById(battleId);
        if (!battle) {
            res.status(404).json({ error: 'Battle not found' });
            return;
        }
        // Vérifier que l'utilisateur fait partie de la battle
        if (battle.longPlayer.toString() !== String(user._id) &&
            battle.shortPlayer.toString() !== String(user._id)) {
            res.status(403).json({ error: 'Not authorized to resolve this battle' });
            return;
        }
        const resolved = await battleService_1.default.resolveBattle(battle._id);
        if (!resolved) {
            res.status(400).json({ error: 'Battle cannot be resolved yet or already resolved' });
            return;
        }
        // Récupérer la battle mise à jour
        const updatedBattle = await Battle_1.default.findById(battleId)
            .populate('longPlayer', 'walletAddress')
            .populate('shortPlayer', 'walletAddress')
            .populate('winner', 'walletAddress');
        res.json({
            message: 'Battle resolved',
            battle: {
                id: updatedBattle._id,
                winner: {
                    id: updatedBattle.winner?._id,
                    address: updatedBattle.winner?.walletAddress,
                },
                status: updatedBattle.status,
                resolvedAt: updatedBattle.resolvedAt,
            },
        });
    }
    catch (error) {
        console.error('Resolve battle error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
