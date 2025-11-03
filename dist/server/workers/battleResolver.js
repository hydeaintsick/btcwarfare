"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBattleResolver = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const battleService_1 = __importDefault(require("../services/battleService"));
/**
 * Worker pour résoudre automatiquement les battles expirées
 * Exécuté toutes les 10 secondes
 */
const startBattleResolver = () => {
    // Résoudre les battles toutes les 10 secondes
    node_cron_1.default.schedule('*/10 * * * * *', async () => {
        try {
            await battleService_1.default.resolveExpiredBattles();
        }
        catch (error) {
            console.error('Battle resolver cron error:', error);
        }
    });
    console.log('✅ Battle resolver worker started');
};
exports.startBattleResolver = startBattleResolver;
