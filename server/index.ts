import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import btcRoutes from './routes/btc';
import walletRoutes from './routes/wallet';
import battleRoutes from './routes/battle';
import { startBattleResolver } from './workers/battleResolver';
import { startDepositMonitor } from './workers/depositMonitor';
import platformConfigService from './services/platformConfigService';
import blockchainService from './services/blockchainService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'BTCWarfare API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/btc', btcRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/battle', battleRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialiser les configurations par défaut de la plateforme
    await platformConfigService.initializeDefaults();
    console.log('✅ Platform configurations initialized');

    // Tester la connexion blockchain (pour s'assurer que le provider est bien configuré)
    try {
      await blockchainService.getDepositAddress();
      console.log('✅ Blockchain provider initialized and ready');
    } catch (error: any) {
      console.error('⚠️  WARNING: Blockchain provider initialization failed:', error.message);
      console.error('   Some features may not work until RPC_URL is properly configured.');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start background workers
    startBattleResolver();
    startDepositMonitor();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

