"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Battle_1 = __importDefault(require("../models/Battle"));
const User_1 = __importDefault(require("../models/User"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const priceService_1 = __importDefault(require("./priceService"));
const BATTLE_DURATION = 60; // 60 secondes
const COMMISSION_RATE = 5; // 5%
class BattleService {
    /**
     * Met à jour le prix de départ d'une battle
     */
    async updateBattleStartPrice(battleId) {
        try {
            const battle = await Battle_1.default.findById(battleId);
            if (!battle || battle.startPrice > 0) {
                return false; // Battle déjà initialisée
            }
            const priceData = await priceService_1.default.getBTCPrice();
            battle.startPrice = priceData.price;
            await battle.save();
            return true;
        }
        catch (error) {
            console.error('Update start price error:', error);
            return false;
        }
    }
    /**
     * Résout une battle
     */
    async resolveBattle(battleId) {
        try {
            const battle = await Battle_1.default.findById(battleId).populate('longPlayer shortPlayer');
            if (!battle || battle.status !== 'active') {
                return false;
            }
            // Vérifier que 60 secondes sont écoulées
            const now = new Date();
            const elapsed = (now.getTime() - battle.startTime.getTime()) / 1000;
            if (elapsed < BATTLE_DURATION) {
                return false; // Pas encore terminé
            }
            // Récupérer le prix actuel
            const priceData = await priceService_1.default.getBTCPrice();
            const currentPrice = priceData.price;
            // Déterminer le gagnant
            let winnerId;
            if (currentPrice > battle.startPrice) {
                // Prix monté : Long gagne
                winnerId = battle.longPlayer._id;
            }
            else if (currentPrice < battle.startPrice) {
                // Prix descendu : Short gagne
                winnerId = battle.shortPlayer._id;
            }
            else {
                // Prix égal : Long par défaut (comme dans le smart contract)
                winnerId = battle.longPlayer._id;
            }
            // Calculer les montants
            // Les frais de 5% ont déjà été prélevés lors de la mise, donc le winner récupère tout
            const totalStake = battle.stakeAmount * 2;
            const winnerAmount = totalStake;
            // Récupérer les utilisateurs
            const winner = await User_1.default.findById(winnerId);
            const loser = await User_1.default.findById(winnerId.toString() === battle.longPlayer._id.toString()
                ? battle.shortPlayer._id
                : battle.longPlayer._id);
            if (!winner || !loser) {
                return false;
            }
            // Créditer le gagnant
            if (battle.currency === 'ETH') {
                winner.balanceETH += winnerAmount;
            }
            else {
                winner.balanceUSDT += winnerAmount;
            }
            await winner.save();
            // Créer les transactions
            await Transaction_1.default.create({
                userId: winnerId,
                type: 'win',
                amount: winnerAmount,
                currency: battle.currency,
                status: 'completed',
                relatedBattleId: battleId,
            });
            // Mettre à jour la battle
            battle.status = 'resolved';
            battle.winner = winnerId;
            battle.resolvedAt = now;
            await battle.save();
            return true;
        }
        catch (error) {
            console.error('Resolve battle error:', error);
            return false;
        }
    }
    /**
     * Résout automatiquement toutes les battles terminées
     */
    async resolveExpiredBattles() {
        try {
            const now = new Date();
            const expiredTime = new Date(now.getTime() - BATTLE_DURATION * 1000);
            const expiredBattles = await Battle_1.default.find({
                status: 'active',
                startTime: { $lte: expiredTime },
            });
            for (const battle of expiredBattles) {
                await this.resolveBattle(battle._id);
            }
        }
        catch (error) {
            console.error('Resolve expired battles error:', error);
        }
    }
}
exports.default = new BattleService();
