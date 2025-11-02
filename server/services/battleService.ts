import Battle from '../models/Battle';
import User from '../models/User';
import Transaction from '../models/Transaction';
import priceService from './priceService';
import { Types } from 'mongoose';

const BATTLE_DURATION = 60; // 60 secondes
const COMMISSION_RATE = 5; // 5%

class BattleService {
  /**
   * Met à jour le prix de départ d'une battle
   */
  async updateBattleStartPrice(battleId: Types.ObjectId): Promise<boolean> {
    try {
      const battle = await Battle.findById(battleId);
      if (!battle || battle.startPrice > 0) {
        return false; // Battle déjà initialisée
      }

      const priceData = await priceService.getBTCPrice();
      battle.startPrice = priceData.price;
      await battle.save();

      return true;
    } catch (error) {
      console.error('Update start price error:', error);
      return false;
    }
  }

  /**
   * Résout une battle
   */
  async resolveBattle(battleId: Types.ObjectId): Promise<boolean> {
    try {
      const battle = await Battle.findById(battleId).populate('longPlayer shortPlayer');
      
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
      const priceData = await priceService.getBTCPrice();
      const currentPrice = priceData.price;

      // Déterminer le gagnant
      let winnerId: Types.ObjectId;
      
      if (currentPrice > battle.startPrice) {
        // Prix monté : Long gagne
        winnerId = battle.longPlayer._id;
      } else if (currentPrice < battle.startPrice) {
        // Prix descendu : Short gagne
        winnerId = battle.shortPlayer._id;
      } else {
        // Prix égal : Long par défaut (comme dans le smart contract)
        winnerId = battle.longPlayer._id;
      }

      // Calculer les montants
      const totalStake = battle.stakeAmount * 2;
      const commission = (totalStake * COMMISSION_RATE) / 100;
      const winnerAmount = totalStake - commission;

      // Récupérer les utilisateurs
      const winner = await User.findById(winnerId);
      const loser = await User.findById(
        winnerId.toString() === battle.longPlayer._id.toString()
          ? battle.shortPlayer._id
          : battle.longPlayer._id
      );

      if (!winner || !loser) {
        return false;
      }

      // Créditer le gagnant
      if (battle.currency === 'ETH') {
        winner.balanceETH += winnerAmount;
      } else {
        winner.balanceUSDT += winnerAmount;
      }
      await winner.save();

      // Créer les transactions
      await Transaction.create({
        userId: winnerId,
        type: 'win',
        amount: winnerAmount,
        currency: battle.currency,
        status: 'completed',
        relatedBattleId: battleId,
      });

      await Transaction.create({
        userId: winnerId,
        type: 'commission',
        amount: commission,
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
    } catch (error) {
      console.error('Resolve battle error:', error);
      return false;
    }
  }

  /**
   * Résout automatiquement toutes les battles terminées
   */
  async resolveExpiredBattles(): Promise<void> {
    try {
      const now = new Date();
      const expiredTime = new Date(now.getTime() - BATTLE_DURATION * 1000);

      const expiredBattles = await Battle.find({
        status: 'active',
        startTime: { $lte: expiredTime },
      });

      for (const battle of expiredBattles) {
        await this.resolveBattle(battle._id);
      }
    } catch (error) {
      console.error('Resolve expired battles error:', error);
    }
  }
}

export default new BattleService();

