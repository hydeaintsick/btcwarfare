"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PlatformConfig_1 = __importDefault(require("../models/PlatformConfig"));
/**
 * Service pour gérer les configurations de la plateforme
 */
class PlatformConfigService {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.CACHE_TTL = 60000; // 1 minute
    }
    /**
     * Récupère une valeur de configuration
     */
    async getConfig(key, defaultValue) {
        // Vérifier le cache
        const cached = this.cache.get(key);
        const expiry = this.cacheExpiry.get(key);
        if (cached && expiry && Date.now() < expiry) {
            return cached;
        }
        try {
            const config = await PlatformConfig_1.default.findOne({ key });
            if (config) {
                // Mettre en cache
                this.cache.set(key, config.value);
                this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
                return config.value;
            }
            // Si pas trouvé et valeur par défaut fournie, l'initialiser
            if (defaultValue !== undefined) {
                await this.setConfig(key, defaultValue);
                return defaultValue;
            }
            return null;
        }
        catch (error) {
            console.error(`Error getting config ${key}:`, error);
            return defaultValue || null;
        }
    }
    /**
     * Définit une valeur de configuration
     */
    async setConfig(key, value, description) {
        try {
            await PlatformConfig_1.default.findOneAndUpdate({ key }, {
                value,
                description,
                updatedAt: new Date(),
            }, {
                upsert: true,
                new: true,
            });
            // Invalider le cache
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            console.log(`✅ Platform config updated: ${key}`);
        }
        catch (error) {
            console.error(`Error setting config ${key}:`, error);
            throw error;
        }
    }
    /**
     * Initialise les configurations par défaut
     */
    async initializeDefaults() {
        try {
            // Adresse de dépôt par défaut
            const depositAddress = await this.getConfig('DEPOSIT_ADDRESS');
            if (!depositAddress) {
                await this.setConfig('DEPOSIT_ADDRESS', '0x8af5e8943ffc8dbf373f20df191687156ce185e9', 'Platform deposit address for receiving ETH and USDT deposits');
                console.log('✅ Default deposit address initialized');
            }
        }
        catch (error) {
            console.error('Error initializing default configs:', error);
        }
    }
    /**
     * Invalide le cache (utile après mise à jour)
     */
    invalidateCache(key) {
        if (key) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
        }
        else {
            this.cache.clear();
            this.cacheExpiry.clear();
        }
    }
}
exports.default = new PlatformConfigService();
