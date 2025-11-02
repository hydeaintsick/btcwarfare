import cron from 'node-cron';
import depositService from '../services/depositService';

/**
 * Worker pour détecter automatiquement les dépôts entrants
 * Exécuté toutes les 30 secondes
 */
export const startDepositMonitor = (): void => {
  // Scanner les dépôts toutes les 30 secondes
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await depositService.scanDeposits();
    } catch (error) {
      console.error('Deposit monitor cron error:', error);
    }
  });

  console.log('✅ Deposit monitor worker started');
};

