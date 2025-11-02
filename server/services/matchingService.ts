import Queue from '../models/Queue';
import User from '../models/User';
import Battle from '../models/Battle';
import Transaction from '../models/Transaction';
import { Types } from 'mongoose';

class MatchingService {
  /**
   * Matche un joueur Long avec un joueur Short
   */
  async matchPlayers(): Promise<Battle | null> {
    try {
      // Récupérer le premier Long et le premier Short (FIFO)
      const longQueue = await Queue.findOne({ position: 'long' }).sort({ joinedAt: 1 });
      const shortQueue = await Queue.findOne({ position: 'short' }).sort({ joinedAt: 1 });

      if (!longQueue || !shortQueue) {
        return null; // Pas assez de joueurs
      }

      // Vérifier que les montants et devises correspondent
      if (
        longQueue.stakeAmount !== shortQueue.stakeAmount ||
        longQueue.currency !== shortQueue.currency
      ) {
        // Pour MVP, on match quand même même si montants différents
        // On prend le plus petit montant
        const stakeAmount = Math.min(longQueue.stakeAmount, shortQueue.stakeAmount);
        const currency = longQueue.currency; // Priorité au long

        // Vérifier les balances
        const longUser = await User.findById(longQueue.userId);
        const shortUser = await User.findById(shortQueue.userId);

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
          await Queue.deleteOne({ _id: longQueue._id });
          await Queue.deleteOne({ _id: shortQueue._id });
          return null;
        }

        // Prélever les montants (stake + 5% de frais)
        if (currency === 'ETH') {
          longUser.balanceETH -= totalStakeWithFee;
          shortUser.balanceETH -= totalStakeWithFee;
        } else {
          longUser.balanceUSDT -= totalStakeWithFee;
          shortUser.balanceUSDT -= totalStakeWithFee;
        }

        await longUser.save();
        await shortUser.save();

        // Créer les transactions de mise avec frais
        await Transaction.create({
          userId: longUser._id,
          type: 'stake',
          amount: stakeAmount,
          currency,
          status: 'completed',
          feeAmount: stakeFee,
        });

        await Transaction.create({
          userId: shortUser._id,
          type: 'stake',
          amount: stakeAmount,
          currency,
          status: 'completed',
          feeAmount: stakeFee,
        });

        // Créer les transactions de frais pour la plateforme
        await Transaction.create({
          userId: longUser._id,
          type: 'fee',
          amount: stakeFee,
          currency,
          status: 'completed',
        });

        await Transaction.create({
          userId: shortUser._id,
          type: 'fee',
          amount: stakeFee,
          currency,
          status: 'completed',
        });

        // Créer la battle
        const battle = await Battle.create({
          longPlayer: longUser._id,
          shortPlayer: shortUser._id,
          startPrice: 0, // Sera mis à jour par le service de battle
          startTime: new Date(),
          stakeAmount,
          currency,
          status: 'active',
        });

        // Retirer les joueurs des queues
        await Queue.deleteOne({ _id: longQueue._id });
        await Queue.deleteOne({ _id: shortQueue._id });

        return battle;
      }

      // Les montants correspondent
      const stakeAmount = longQueue.stakeAmount;
      const currency = longQueue.currency;

      // Vérifier les balances
      const longUser = await User.findById(longQueue.userId);
      const shortUser = await User.findById(shortQueue.userId);

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
        await Queue.deleteOne({ _id: longQueue._id });
        await Queue.deleteOne({ _id: shortQueue._id });
        return null;
      }

      // Prélever les montants (stake + 5% de frais)
      if (currency === 'ETH') {
        longUser.balanceETH -= totalStakeWithFee;
        shortUser.balanceETH -= totalStakeWithFee;
      } else {
        longUser.balanceUSDT -= totalStakeWithFee;
        shortUser.balanceUSDT -= totalStakeWithFee;
      }

      await longUser.save();
      await shortUser.save();

      // Créer les transactions de mise avec frais
      await Transaction.create({
        userId: longUser._id,
        type: 'stake',
        amount: stakeAmount,
        currency,
        status: 'completed',
        feeAmount: stakeFee,
      });

      await Transaction.create({
        userId: shortUser._id,
        type: 'stake',
        amount: stakeAmount,
        currency,
        status: 'completed',
        feeAmount: stakeFee,
      });

      // Créer les transactions de frais pour la plateforme
      await Transaction.create({
        userId: longUser._id,
        type: 'fee',
        amount: stakeFee,
        currency,
        status: 'completed',
      });

      await Transaction.create({
        userId: shortUser._id,
        type: 'fee',
        amount: stakeFee,
        currency,
        status: 'completed',
      });

      // Créer la battle
      const battle = await Battle.create({
        longPlayer: longUser._id,
        shortPlayer: shortUser._id,
        startPrice: 0, // Sera mis à jour par le service de battle
        startTime: new Date(),
        stakeAmount,
        currency,
        status: 'active',
      });

      // Retirer les joueurs des queues
      await Queue.deleteOne({ _id: longQueue._id });
      await Queue.deleteOne({ _id: shortQueue._id });

      return battle;
    } catch (error) {
      console.error('Matching error:', error);
      return null;
    }
  }
}

export default new MatchingService();

