import express, { Request, Response } from 'express';
import priceService from '../services/priceService';

const router = express.Router();

/**
 * GET /api/btc/price
 * Récupère le prix actuel de BTC/USD
 */
router.get('/price', async (req: Request, res: Response) => {
  try {
    const priceData = await priceService.getBTCPrice();
    
    // Convertir en format 8 décimales (comme Chainlink)
    const priceInE8 = Math.floor(priceData.price * 1e8);
    
    res.json({
      price: priceData.price,
      priceE8: priceInE8,
      source: priceData.source,
      timestamp: priceData.timestamp,
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch BTC price' });
  }
});

export default router;

