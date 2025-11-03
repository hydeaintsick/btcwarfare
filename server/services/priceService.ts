interface PriceData {
  price: number;
  timestamp: number;
  source: string;
}

class PriceService {
  private cache: PriceData | null = null;
  private cacheTTL = 5000; // 5 secondes
  private lastFetch = 0;

  /**
   * Récupère le prix BTC/USD depuis CoinGecko
   */
  private async fetchFromCoinGecko(): Promise<number | null> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      return data.bitcoin?.usd || null;
    } catch (error) {
      console.error('CoinGecko fetch error:', error);
      return null;
    }
  }

  /**
   * Récupère le prix BTC/USD depuis Binance
   */
  private async fetchFromBinance(): Promise<number | null> {
    try {
      const response = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
      );
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      return parseFloat(data.price) || null;
    } catch (error) {
      console.error('Binance fetch error:', error);
      return null;
    }
  }

  /**
   * Récupère le prix BTC/USD avec fallback
   * Priorité: Binance -> CoinGecko
   */
  async getBTCPrice(): Promise<{ price: number; source: string; timestamp: number }> {
    const now = Date.now();
    
    // Retourner le cache si encore valide
    if (this.cache && now - this.lastFetch < this.cacheTTL) {
      return {
        price: this.cache.price,
        source: this.cache.source,
        timestamp: this.cache.timestamp,
      };
    }

    // Essayer Binance d'abord (plus fiable, moins de rate limits)
    let price = await this.fetchFromBinance();
    let source = 'binance';

    // Fallback sur CoinGecko si Binance échoue
    if (price === null) {
      price = await this.fetchFromCoinGecko();
      source = 'coingecko';
    }

    // Si tout échoue, retourner le cache ou une erreur
    if (price === null) {
      if (this.cache) {
        console.warn('All price APIs failed, returning cached price');
        return {
          price: this.cache.price,
          source: this.cache.source + ' (cached)',
          timestamp: this.cache.timestamp,
        };
      }
      throw new Error('Failed to fetch BTC price from all sources');
    }

    // Mettre à jour le cache
    this.cache = {
      price,
      timestamp: now,
      source,
    };
    this.lastFetch = now;

    return {
      price,
      source,
      timestamp: now,
    };
  }

  /**
   * Réinitialise le cache (utile pour les tests)
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export default new PriceService();

