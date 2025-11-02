import PlatformConfig from '../models/PlatformConfig';

/**
 * Service pour gérer les configurations de la plateforme
 */
class PlatformConfigService {
  private cache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Récupère une valeur de configuration
   */
  async getConfig(key: string, defaultValue?: string): Promise<string | null> {
    // Vérifier le cache
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const config = await PlatformConfig.findOne({ key });
      
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
    } catch (error) {
      console.error(`Error getting config ${key}:`, error);
      return defaultValue || null;
    }
  }

  /**
   * Définit une valeur de configuration
   */
  async setConfig(key: string, value: string, description?: string): Promise<void> {
    try {
      await PlatformConfig.findOneAndUpdate(
        { key },
        { 
          value,
          description,
          updatedAt: new Date(),
        },
        { 
          upsert: true,
          new: true,
        }
      );

      // Invalider le cache
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      
      console.log(`✅ Platform config updated: ${key}`);
    } catch (error) {
      console.error(`Error setting config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Initialise les configurations par défaut
   */
  async initializeDefaults(): Promise<void> {
    try {
      // Adresse de dépôt par défaut
      const depositAddress = await this.getConfig('DEPOSIT_ADDRESS');
      if (!depositAddress) {
        await this.setConfig(
          'DEPOSIT_ADDRESS',
          '0x8af5e8943ffc8dbf373f20df191687156ce185e9',
          'Platform deposit address for receiving ETH and USDT deposits'
        );
        console.log('✅ Default deposit address initialized');
      }
    } catch (error) {
      console.error('Error initializing default configs:', error);
    }
  }

  /**
   * Invalide le cache (utile après mise à jour)
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }
}

export default new PlatformConfigService();

