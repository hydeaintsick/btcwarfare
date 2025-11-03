"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = __importDefault(require("../models/Queue"));
const User_1 = __importDefault(require("../models/User"));
const Battle_1 = __importDefault(require("../models/Battle"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
class MatchingService {
    /**
     * Matche un joueur Long avec un joueur Short
     */
    async matchPlayers() {
        try {
            // Récupérer le premier Long et le premier Short (FIFO)
            const longQueue = await Queue_1.default.findOne({ position: 'long' }).sort({ joinedAt: 1 });
            const shortQueue = await Queue_1.default.findOne({ position: 'short' }).sort({ joinedAt: 1 });
            if (!longQueue || !shortQueue) {
                return null; // Pas assez de joueurs
            }
            // Vérifier que les montants et devises correspondent
            if (longQueue.stakeAmount !== shortQueue.stakeAmount ||
                longQueue.currency !== shortQueue.currency) {
                // Pour MVP, on match quand même même si montants différents
                // On prend le plus petit montant
                const stakeAmount = Math.min(longQueue.stakeAmount, shortQueue.stakeAmount);
                const currency = longQueue.currency; // Priorité au long
                // Vérifier les balances
                const longUser = await User_1.default.findById(longQueue.userId);
                const shortUser = await User_1.default.findById(shortQueue.userId);
                if (!longUser || !shortUser) {
                    return null;
                }
                // Calculer les frais de 5% sur chaque pari
                const stakeFee = stakeAmount * 0.05;
                const totalStakeWithFee = stakeAmount + stakeFee;
                const longBalance = currency === 'ETH' ? longUser.balanceETH : longUser.balanceUSDT;
                const shortBalance = currency === 'ETH' ? shortUser.balanceETH : shortUser.balanceUSDT;
                if (longBalance < totalStakeWithFee || shortBalance < totalStakeWithFee) {
                    // Pas assez de fonds, retirer de la queue
                    await Queue_1.default.deleteOne({ _id: longQueue._id });
                    await Queue_1.default.deleteOne({ _id: shortQueue._id });
                    return null;
                }
                // Prélever les montants (stake + 5% de frais)
                if (currency === 'ETH') {
                    longUser.balanceETH -= totalStakeWithFee;
                    shortUser.balanceETH -= totalStakeWithFee;
                }
                else {
                    longUser.balanceUSDT -= totalStakeWithFee;
                    shortUser.balanceUSDT -= totalStakeWithFee;
                }
                await longUser.save();
                await shortUser.save();
                // Créer les transactions de mise avec frais
                await Transaction_1.default.create({
                    userId: longUser._id,
                    type: 'stake',
                    amount: stakeAmount,
                    currency,
                    status: 'completed',
                    feeAmount: stakeFee,
                });
                await Transaction_1.default.create({
                    userId: shortUser._id,
                    type: 'stake',
                    amount: stakeAmount,
                    currency,
                    status: 'completed',
                    feeAmount: stakeFee,
                });
                // Créer les transactions de frais pour la plateforme
                await Transaction_1.default.create({
                    userId: longUser._id,
                    type: 'fee',
                    amount: stakeFee,
                    currency,
                    status: 'completed',
                });
                await Transaction_1.default.create({
                    userId: shortUser._id,
                    type: 'fee',
                    amount: stakeFee,
                    currency,
                    status: 'completed',
                });
                // Créer la battle
                const battle = await Battle_1.default.create({
                    longPlayer: longUser._id,
                    shortPlayer: shortUser._id,
                    startPrice: 0, // Sera mis à jour par le service de battle
                    startTime: new Date(),
                    stakeAmount,
                    currency,
                    status: 'active',
                });
                // Retirer les joueurs des queues
                await Queue_1.default.deleteOne({ _id: longQueue._id });
                await Queue_1.default.deleteOne({ _id: shortQueue._id });
                return battle;
            }
            // Les montants correspondent
            const stakeAmount = longQueue.stakeAmount;
            const currency = longQueue.currency;
            // Vérifier les balances
            const longUser = await User_1.default.findById(longQueue.userId);
            const shortUser = await User_1.default.findById(shortQueue.userId);
            if (!longUser || !shortUser) {
                return null;
            }
            // Calculer les frais de 5% sur chaque pari
            const stakeFee = stakeAmount * 0.05;
            const totalStakeWithFee = stakeAmount + stakeFee;
            const longBalance = currency === 'ETH' ? longUser.balanceETH : longUser.balanceUSDT;
            const shortBalance = currency === 'ETH' ? shortUser.balanceETH : shortUser.balanceUSDT;
            if (longBalance < totalStakeWithFee || shortBalance < totalStakeWithFee) {
                // Pas assez de fonds, retirer de la queue
                await Queue_1.default.deleteOne({ _id: longQueue._id });
                await Queue_1.default.deleteOne({ _id: shortQueue._id });
                return null;
            }
            // Prélever les montants (stake + 5% de frais)
            if (currency === 'ETH') {
                longUser.balanceETH -= totalStakeWithFee;
                shortUser.balanceETH -= totalStakeWithFee;
            }
            else {
                longUser.balanceUSDT -= totalStakeWithFee;
                shortUser.balanceUSDT -= totalStakeWithFee;
            }
            await longUser.save();
            await shortUser.save();
            // Créer les transactions de mise avec frais
            await Transaction_1.default.create({
                userId: longUser._id,
                type: 'stake',
                amount: stakeAmount,
                currency,
                status: 'completed',
                feeAmount: stakeFee,
            });
            await Transaction_1.default.create({
                userId: shortUser._id,
                type: 'stake',
                amount: stakeAmount,
                currency,
                status: 'completed',
                feeAmount: stakeFee,
            });
            // Créer les transactions de frais pour la plateforme
            await Transaction_1.default.create({
                userId: longUser._id,
                type: 'fee',
                amount: stakeFee,
                currency,
                status: 'completed',
            });
            await Transaction_1.default.create({
                userId: shortUser._id,
                type: 'fee',
                amount: stakeFee,
                currency,
                status: 'completed',
            });
            // Créer la battle
            const battle = await Battle_1.default.create({
                longPlayer: longUser._id,
                shortPlayer: shortUser._id,
                startPrice: 0, // Sera mis à jour par le service de battle
                startTime: new Date(),
                stakeAmount,
                currency,
                status: 'active',
            });
            // Retirer les joueurs des queues
            await Queue_1.default.deleteOne({ _id: longQueue._id });
            await Queue_1.default.deleteOne({ _id: shortQueue._id });
            return battle;
        }
        catch (error) {
            console.error('Matching error:', error);
            return null;
        }
    }
}
exports.default = new MatchingService();
