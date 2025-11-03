"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPriceCollector = startPriceCollector;
exports.stopPriceCollector = stopPriceCollector;
const PriceData_1 = __importDefault(require("../models/PriceData"));
const OrderBookSnapshot_1 = __importDefault(require("../models/OrderBookSnapshot"));
let collectorInterval = null;
let isCollecting = false;
/**
 * Collecte le prix BTC depuis Binance
 */
async function collectPrice() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        const data = await response.json();
        const price = parseFloat(data.price);
        const timestamp = Date.now();
        // Stocker le point de prix
        await PriceData_1.default.create({
            timestamp,
            price,
            source: 'binance',
        });
    }
    catch (error) {
        console.error('Error collecting price:', error.message);
        // Ne pas crasher le worker en cas d'erreur
    }
}
/**
 * Collecte le carnet d'ordres depuis Binance
 */
async function collectOrderBook() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20');
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        const data = await response.json();
        const timestamp = Date.now();
        // Convertir les strings en nombres
        const bids = data.bids.map((bid) => [
            parseFloat(bid[0]),
            parseFloat(bid[1]),
        ]);
        const asks = data.asks.map((ask) => [
            parseFloat(ask[0]),
            parseFloat(ask[1]),
        ]);
        // Stocker le snapshot du carnet d'ordres
        await OrderBookSnapshot_1.default.create({
            timestamp,
            bids,
            asks,
        });
    }
    catch (error) {
        console.error('Error collecting order book:', error.message);
        // Ne pas crasher le worker en cas d'erreur
    }
}
/**
 * Collecte les données (prix et carnet d'ordres) toutes les 2 secondes
 */
async function collectData() {
    if (isCollecting) {
        return; // Éviter les collectes simultanées
    }
    isCollecting = true;
    try {
        // Collecter prix et carnet d'ordres en parallèle
        await Promise.all([collectPrice(), collectOrderBook()]);
    }
    catch (error) {
        console.error('Error in collectData:', error.message);
    }
    finally {
        isCollecting = false;
    }
}
/**
 * Démarre le worker de collecte de prix
 */
function startPriceCollector() {
    if (collectorInterval) {
        console.log('⚠️  Price collector is already running');
        return;
    }
    console.log('🚀 Starting price collector (2s interval)');
    // Collecter immédiatement au démarrage
    collectData();
    // Puis collecter toutes les 2 secondes
    collectorInterval = setInterval(collectData, 2000);
}
/**
 * Arrête le worker de collecte de prix
 */
function stopPriceCollector() {
    if (collectorInterval) {
        clearInterval(collectorInterval);
        collectorInterval = null;
        console.log('⏹️  Price collector stopped');
    }
}
