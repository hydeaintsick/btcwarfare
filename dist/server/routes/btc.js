"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const priceService_1 = __importDefault(require("../services/priceService"));
const router = express_1.default.Router();
/**
 * GET /api/btc/price
 * Récupère le prix actuel de BTC/USD
 */
router.get('/price', async (req, res) => {
    try {
        const priceData = await priceService_1.default.getBTCPrice();
        // Convertir en format 8 décimales (comme Chainlink)
        const priceInE8 = Math.floor(priceData.price * 1e8);
        res.json({
            price: priceData.price,
            priceE8: priceInE8,
            source: priceData.source,
            timestamp: priceData.timestamp,
        });
    }
    catch (error) {
        console.error('Price fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch BTC price' });
    }
});
exports.default = router;
