"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTANT: Load environment variables FIRST before any other imports
// This ensures that process.env is populated before modules are evaluated
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const btc_1 = __importDefault(require("./routes/btc"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const battle_1 = __importDefault(require("./routes/battle"));
const guarantee_1 = __importDefault(require("./routes/guarantee"));
const admin_1 = __importDefault(require("./routes/admin"));
const market_1 = __importDefault(require("./routes/market"));
const battleResolver_1 = require("./workers/battleResolver");
const depositMonitor_1 = require("./workers/depositMonitor");
const priceCollector_1 = require("./workers/priceCollector");
const platformConfigService_1 = __importDefault(require("./services/platformConfigService"));
const blockchainService_1 = __importDefault(require("./services/blockchainService"));
const ensureTTLIndexes_1 = require("./utils/ensureTTLIndexes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'BTCWarfare API is running' });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/btc', btc_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/battle', battle_1.default);
app.use('/api', guarantee_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/market', market_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.connectDatabase)();
        // S'assurer que les index TTL sont correctement créés
        await (0, ensureTTLIndexes_1.ensureTTLIndexes)();
        // Initialiser les configurations par défaut de la plateforme
        await platformConfigService_1.default.initializeDefaults();
        console.log('✅ Platform configurations initialized');
        // Tester la connexion blockchain (pour s'assurer que le provider est bien configuré)
        try {
            await blockchainService_1.default.getDepositAddress();
            console.log('✅ Blockchain provider initialized and ready');
        }
        catch (error) {
            console.error('⚠️  WARNING: Blockchain provider initialization failed:', error.message);
            console.error('   Some features may not work until RPC_URL is properly configured.');
        }
        // Start Express server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        // Start background workers
        (0, battleResolver_1.startBattleResolver)();
        (0, depositMonitor_1.startDepositMonitor)();
        (0, priceCollector_1.startPriceCollector)();
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
// Gérer l'arrêt propre du serveur
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    (0, priceCollector_1.stopPriceCollector)();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    (0, priceCollector_1.stopPriceCollector)();
    process.exit(0);
});
