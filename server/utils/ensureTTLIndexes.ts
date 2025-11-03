import PriceData from '../models/PriceData';
import OrderBookSnapshot from '../models/OrderBookSnapshot';

/**
 * S'assure que les index TTL sont correctement créés dans MongoDB
 * Cette fonction doit être appelée au démarrage du serveur pour garantir
 * que les données sont automatiquement supprimées après 15 minutes
 */
export async function ensureTTLIndexes(): Promise<void> {
  try {
    // Vérifier et créer l'index TTL pour PriceData
    const priceIndexes = await PriceData.collection.getIndexes();
    const priceHasTTL = Object.values(priceIndexes).some((idx: any) => idx.expireAfterSeconds);
    
    if (!priceHasTTL) {
      await PriceData.collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 900, name: 'createdAt_ttl' }
      );
      console.log('✅ TTL index created for PriceData (15 minutes)');
    } else {
      console.log('✅ TTL index already exists for PriceData');
    }

    // Vérifier et créer l'index TTL pour OrderBookSnapshot
    const orderBookIndexes = await OrderBookSnapshot.collection.getIndexes();
    const orderBookHasTTL = Object.values(orderBookIndexes).some((idx: any) => idx.expireAfterSeconds);
    
    if (!orderBookHasTTL) {
      await OrderBookSnapshot.collection.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 900, name: 'createdAt_ttl' }
      );
      console.log('✅ TTL index created for OrderBookSnapshot (15 minutes)');
    } else {
      console.log('✅ TTL index already exists for OrderBookSnapshot');
    }
  } catch (error) {
    console.error('❌ Error ensuring TTL indexes:', error);
    throw error;
  }
}
