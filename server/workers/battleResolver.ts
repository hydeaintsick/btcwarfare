import cron from 'node-cron';
import battleService from '../services/battleService';

/**
 * Worker pour résoudre automatiquement les battles expirées
 * Exécuté toutes les 10 secondes
 */
export const startBattleResolver = (): void => {
  // Résoudre les battles toutes les 10 secondes
  cron.schedule('*/10 * * * * *', async () => {
    try {
      await battleService.resolveExpiredBattles();
    } catch (error) {
      console.error('Battle resolver cron error:', error);
    }
  });

  console.log('✅ Battle resolver worker started');
};

