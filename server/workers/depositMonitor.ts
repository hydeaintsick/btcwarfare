import cron from 'node-cron';

/**
 * Worker pour détecter automatiquement les dépôts entrants
 * DÉSACTIVÉ: Les dépôts sont vérifiés manuellement par les utilisateurs via checkTransactionForUser
 * pour éviter de surcharger les RPC gratuits avec des scans continus
 */
export const startDepositMonitor = (): void => {
  // Worker désactivé - les dépôts sont vérifiés à la demande par les utilisateurs
  console.log('⚠️  Automatic deposit monitor is DISABLED. Users must manually check transactions.');
};

