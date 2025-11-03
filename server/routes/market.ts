import { Router, Request, Response } from 'express';
import PriceData from '../models/PriceData';
import OrderBookSnapshot from '../models/OrderBookSnapshot';
import { getCandlesticks } from '../services/candlestickService';

const router = Router();

/**
 * GET /api/market/realtime
 * Retourne les ~150 derniers points de prix (5 dernières minutes)
 */
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    // Récupérer les points des 5 dernières minutes, triés par timestamp croissant
    const pricePoints = await PriceData.find({
      timestamp: { $gte: fiveMinutesAgo },
    })
      .sort({ timestamp: 1 })
      .limit(150)
      .lean();

    // Formater les données pour le frontend
    const data = pricePoints.map((point) => {
      const date = new Date(point.timestamp);
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return {
        time: `${minutes}:${seconds}`,
        price: point.price,
        timestamp: point.timestamp,
      };
    });

    res.json({ data });
  } catch (error: any) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({ error: 'Failed to fetch realtime data' });
  }
});

/**
 * GET /api/market/candlesticks
 * Retourne les 5 dernières bougies OHLC
 */
router.get('/candlesticks', async (req: Request, res: Response) => {
  try {
    const candlesticks = await getCandlesticks();
    res.json({ candlesticks });
  } catch (error: any) {
    console.error('Error fetching candlesticks:', error);
    res.status(500).json({ error: 'Failed to fetch candlesticks' });
  }
});

/**
 * GET /api/market/orderbook
 * Retourne le dernier snapshot du carnet d'ordres
 */
router.get('/orderbook', async (req: Request, res: Response) => {
  try {
    // Récupérer le dernier snapshot
    const snapshot = await OrderBookSnapshot.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!snapshot) {
      return res.json({
        bids: [],
        asks: [],
        timestamp: Date.now(),
      });
    }

    res.json({
      bids: snapshot.bids,
      asks: snapshot.asks,
      timestamp: snapshot.timestamp,
    });
  } catch (error: any) {
    console.error('Error fetching orderbook:', error);
    res.status(500).json({ error: 'Failed to fetch orderbook' });
  }
});

export default router;

