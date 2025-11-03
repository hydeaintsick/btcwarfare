import PriceData from '../models/PriceData';

export interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

/**
 * Calcule les bougies OHLC pour les 5 dernières minutes
 * Chaque bougie représente 1 minute
 */
export async function getCandlesticks(): Promise<CandlestickData[]> {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  // Récupérer tous les points de prix des 5 dernières minutes
  const pricePoints = await PriceData.find({
    timestamp: { $gte: fiveMinutesAgo },
  })
    .sort({ timestamp: 1 })
    .lean();

  if (pricePoints.length === 0) {
    return [];
  }

  const candlesticks: CandlestickData[] = [];
  const oneMinute = 60 * 1000;

  // Créer 5 bougies de 1 minute chacune
  for (let i = 0; i < 5; i++) {
    const candleStart = fiveMinutesAgo + i * oneMinute;
    const candleEnd = candleStart + oneMinute;

    // Filtrer les points dans cette période de 1 minute
    const pointsInCandle = pricePoints.filter(
      (point) => point.timestamp >= candleStart && point.timestamp < candleEnd
    );

    if (pointsInCandle.length === 0) {
      // Si pas de données pour cette bougie, utiliser la dernière valeur disponible
      const lastCandle = candlesticks[candlesticks.length - 1];
      if (lastCandle) {
        candlesticks.push({
          open: lastCandle.close,
          high: lastCandle.close,
          low: lastCandle.close,
          close: lastCandle.close,
          timestamp: candleStart,
        });
      } else {
        // Première bougie sans données
        const firstAvailablePrice = pricePoints[0]?.price || 0;
        candlesticks.push({
          open: firstAvailablePrice,
          high: firstAvailablePrice,
          low: firstAvailablePrice,
          close: firstAvailablePrice,
          timestamp: candleStart,
        });
      }
    } else {
      // Calculer OHLC pour cette bougie
      const prices = pointsInCandle.map((p) => p.price);
      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);

      candlesticks.push({
        open,
        high,
        low,
        close,
        timestamp: candleStart,
      });
    }
  }

  return candlesticks;
}

