"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PriceData_1 = __importDefault(require("../models/PriceData"));
const OrderBookSnapshot_1 = __importDefault(require("../models/OrderBookSnapshot"));
const candlestickService_1 = require("../services/candlestickService");
const router = (0, express_1.Router)();
/**
 * GET /api/market/realtime
 * Retourne les ~150 derniers points de prix (5 dernières minutes)
 */
router.get('/realtime', async (req, res) => {
    try {
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        // Récupérer les points des 5 dernières minutes, triés par timestamp croissant
        const pricePoints = await PriceData_1.default.find({
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
    }
    catch (error) {
        console.error('Error fetching realtime data:', error);
        res.status(500).json({ error: 'Failed to fetch realtime data' });
    }
});
/**
 * GET /api/market/candlesticks
 * Retourne les 5 dernières bougies OHLC
 */
router.get('/candlesticks', async (req, res) => {
    try {
        const candlesticks = await (0, candlestickService_1.getCandlesticks)();
        res.json({ candlesticks });
    }
    catch (error) {
        console.error('Error fetching candlesticks:', error);
        res.status(500).json({ error: 'Failed to fetch candlesticks' });
    }
});
/**
 * GET /api/market/orderbook
 * Retourne le dernier snapshot du carnet d'ordres
 */
router.get('/orderbook', async (req, res) => {
    try {
        // Récupérer le dernier snapshot
        const snapshot = await OrderBookSnapshot_1.default.findOne()
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
    }
    catch (error) {
        console.error('Error fetching orderbook:', error);
        res.status(500).json({ error: 'Failed to fetch orderbook' });
    }
});
exports.default = router;
