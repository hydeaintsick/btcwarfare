import PriceData from '../models/PriceData';
import OrderBookSnapshot from '../models/OrderBookSnapshot';

let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Nettoie les données anciennes (> 15 minutes)
 * Cette fonction sert de filet de sécurité si les index TTL ne fonctionnent pas correctement
 */
async function cleanupOldData(): Promise<void> {
  try {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;

    // Supprimer les anciens points de prix
    const priceResult = await PriceData.deleteMany({
      createdAt: { $lt: new Date(fifteenMinutesAgo) },
    });

    // Supprimer les anciens snapshots du carnet d'ordres
    const orderBookResult = await OrderBookSnapshot.deleteMany({
      createdAt: { $lt: new Date(fifteenMinutesAgo) },
    });

    if (priceResult.deletedCount > 0 || orderBookResult.deletedCount > 0) {
      console.log(
        `🧹 Cleanup: Deleted ${priceResult.deletedCount} price records and ${orderBookResult.deletedCount} order book snapshots`
      );
    }
  } catch (error: any) {
    console.error('Error cleaning up old data:', error.message);
  }
}

/**
 * Démarre le worker de nettoyage de données
 * Exécute le nettoyage toutes les 5 minutes
 */
export function startDataCleanup(): void {
  if (cleanupInterval) {
    console.log('⚠️  Data cleanup worker is already running');
    return;
  }

  console.log('🚀 Starting data cleanup worker (5min interval)');

  // Exécuter le nettoyage immédiatement au démarrage
  cleanupOldData();

  // Puis exécuter toutes les 5 minutes
  cleanupInterval = setInterval(cleanupOldData, 5 * 60 * 1000);
}

/**
 * Arrête le worker de nettoyage de données
 */
export function stopDataCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('⏹️  Data cleanup worker stopped');
  }
}
