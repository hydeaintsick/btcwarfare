"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureTTLIndexes = ensureTTLIndexes;
const PriceData_1 = __importDefault(require("../models/PriceData"));
const OrderBookSnapshot_1 = __importDefault(require("../models/OrderBookSnapshot"));
/**
 * S'assure que les index TTL sont correctement créés dans MongoDB
 * Cette fonction doit être appelée au démarrage du serveur pour garantir
 * que les données sont automatiquement supprimées après 15 minutes
 */
async function ensureTTLIndexes() {
    try {
        // Recréer les index pour PriceData
        await PriceData_1.default.collection.dropIndexes().catch(() => {
            // Ignorer les erreurs si les index n'existent pas encore
        });
        await PriceData_1.default.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 900, name: 'createdAt_ttl' });
        console.log('✅ TTL index created for PriceData (15 minutes)');
        // Recréer les index pour OrderBookSnapshot
        await OrderBookSnapshot_1.default.collection.dropIndexes().catch(() => {
            // Ignorer les erreurs si les index n'existent pas encore
        });
        await OrderBookSnapshot_1.default.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 900, name: 'createdAt_ttl' });
        console.log('✅ TTL index created for OrderBookSnapshot (15 minutes)');
    }
    catch (error) {
        console.error('❌ Error ensuring TTL indexes:', error);
        throw error;
    }
}
