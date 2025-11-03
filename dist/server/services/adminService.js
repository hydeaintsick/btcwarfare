"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
class AdminService {
    constructor() {
        this.ethPriceCache = null;
        this.ethPriceCacheTTL = 30000; // 30 secondes
        this.lastETHFetch = 0;
    }
    /**
     * Récupère le cours ETH/USD depuis Binance
     */
    async getETHPriceUSD() {
        const now = Date.now();
        // Retourner le cache si encore valide
        if (this.ethPriceCache && now - this.lastETHFetch < this.ethPriceCacheTTL) {
            return this.ethPriceCache.price;
        }
        try {
            // Utiliser ETHUSDT sur Binance
            const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
            if (!response.ok) {
                throw new Error(`Binance API error: ${response.status}`);
            }
            const data = await response.json();
            const price = parseFloat(data.price);
            if (!price || isNaN(price)) {
                throw new Error('Invalid price data from Binance');
            }
            // Mettre à jour le cache
            this.ethPriceCache = {
                price,
                timestamp: now,
                source: 'binance',
            };
            this.lastETHFetch = now;
            return price;
        }
        catch (error) {
            console.error('Error fetching ETH price:', error);
            // Si le cache existe, retourner le cache
            if (this.ethPriceCache) {
                console.warn('ETH price fetch failed, returning cached price');
                return this.ethPriceCache.price;
            }
            // Fallback sur une valeur par défaut (peut être ajusté)
            console.warn('No ETH price available, using fallback: 3000 USD');
            return 3000;
        }
    }
    /**
     * Calcule le total des fonds de la plateforme (fees + commissions en ETH uniquement)
     */
    async getTotalPlatformFunds() {
        try {
            const transactions = await Transaction_1.default.find({
                $or: [
                    { type: 'fee', currency: 'ETH', status: 'completed' },
                    { type: 'commission', currency: 'ETH', status: 'completed' },
                ],
            });
            let total = 0;
            for (const tx of transactions) {
                const amount = tx.amount || 0;
                const feeAmount = tx.feeAmount || 0;
                total += amount + feeAmount;
            }
            return total;
        }
        catch (error) {
            console.error('Error calculating platform funds:', error);
            return 0;
        }
    }
    /**
     * Calcule le total des balances ETH de tous les utilisateurs
     */
    async getTotalUserBalances() {
        try {
            // Récupérer tous les users et calculer leurs balances dynamiquement
            const users = await User_1.default.find({});
            let totalBalance = 0;
            for (const user of users) {
                // Calculer le solde ETH de l'utilisateur à partir des transactions
                const transactions = await Transaction_1.default.find({
                    userId: user._id,
                    currency: 'ETH',
                    status: 'completed',
                });
                let userBalanceETH = 0;
                for (const tx of transactions) {
                    const amount = tx.amount || 0;
                    const feeAmount = tx.feeAmount || 0;
                    if (tx.type === 'deposit') {
                        // Les dépôts créditent le montant après frais
                        userBalanceETH += amount;
                    }
                    else if (tx.type === 'win') {
                        // Les gains créditent le montant total gagné
                        userBalanceETH += amount;
                    }
                    else if (tx.type === 'withdrawal') {
                        // Les retraits débitent le montant total (amount contient déjà les frais)
                        userBalanceETH -= amount;
                    }
                    else if (tx.type === 'stake') {
                        // Les stakes débitent : montant parié + frais
                        userBalanceETH -= amount + feeAmount;
                    }
                }
                // S'assurer que le solde n'est pas négatif
                userBalanceETH = Math.max(0, userBalanceETH);
                totalBalance += userBalanceETH;
            }
            return totalBalance;
        }
        catch (error) {
            console.error('Error calculating total user balances:', error);
            return 0;
        }
    }
    /**
     * Calcule le dépôt moyen par utilisateur (en ETH uniquement)
     */
    async getAverageDepositPerUser() {
        try {
            const depositTransactions = await Transaction_1.default.find({
                type: 'deposit',
                currency: 'ETH',
                status: 'completed',
            });
            if (depositTransactions.length === 0) {
                return 0;
            }
            const totalDeposits = depositTransactions.reduce((sum, tx) => {
                return sum + (tx.amount || 0);
            }, 0);
            // Nombre d'utilisateurs uniques qui ont fait des dépôts
            const uniqueUsers = new Set(depositTransactions.map((tx) => tx.userId.toString()));
            return uniqueUsers.size > 0 ? totalDeposits / uniqueUsers.size : 0;
        }
        catch (error) {
            console.error('Error calculating average deposit:', error);
            return 0;
        }
    }
    /**
     * Récupère les données du dashboard
     */
    async getDashboardStats() {
        const ethPriceUSD = await this.getETHPriceUSD();
        // Récupérer les stats en parallèle
        const [totalUsers, platformFunds, userBalancesOwed, averageDeposit] = await Promise.all([
            User_1.default.countDocuments(),
            this.getTotalPlatformFunds(),
            this.getTotalUserBalances(),
            this.getAverageDepositPerUser(),
        ]);
        // Récupérer les transactions récentes (ETH uniquement)
        const recentTransactions = await Transaction_1.default.find({
            currency: 'ETH',
        })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'walletAddress')
            .populate('relatedBattleId', 'startPrice startTime');
        return {
            totalUsers,
            averageDepositPerUser: averageDeposit,
            platformFunds: {
                eth: platformFunds,
                usd: platformFunds * ethPriceUSD,
            },
            userBalancesOwed: {
                eth: userBalancesOwed,
                usd: userBalancesOwed * ethPriceUSD,
            },
            netPosition: {
                eth: platformFunds - userBalancesOwed,
                usd: (platformFunds - userBalancesOwed) * ethPriceUSD,
            },
            recentTransactions: recentTransactions.map((tx) => ({
                id: tx._id,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                fee: tx.feeAmount,
                status: tx.status,
                txHash: tx.txHash,
                userId: tx.userId,
                relatedBattleId: tx.relatedBattleId,
                createdAt: tx.createdAt,
                updatedAt: tx.updatedAt,
            })),
            ethPriceUSD,
        };
    }
    /**
     * Récupère les données pour le graphique des dépôts ETH
     * @param period - 'day' | 'week' | 'month'
     */
    async getDepositsChartData(period = 'day') {
        const ethPriceUSD = await this.getETHPriceUSD();
        // Déterminer la date de début selon la période
        const now = new Date();
        let startDate;
        switch (period) {
            case 'day':
                // Dernières 30 jours
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'week':
                // Dernières 12 semaines
                startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                // Derniers 12 mois
                startDate = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // Récupérer tous les dépôts ETH dans la période
        const deposits = await Transaction_1.default.find({
            type: 'deposit',
            currency: 'ETH',
            status: 'completed',
            createdAt: { $gte: startDate },
        }).sort({ createdAt: 1 });
        // Grouper par jour/semaine/mois
        const grouped = {};
        for (const deposit of deposits) {
            const date = new Date(deposit.createdAt);
            let key;
            switch (period) {
                case 'day':
                    key = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    break;
                case 'week':
                    // Semaine de l'année
                    const weekNum = this.getWeekNumber(date);
                    key = `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
                    break;
                case 'month':
                    key = `${date.getFullYear()}-${(date.getMonth() + 1)
                        .toString()
                        .padStart(2, '0')}`; // YYYY-MM
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }
            if (!grouped[key]) {
                grouped[key] = 0;
            }
            grouped[key] += deposit.amount || 0;
        }
        // Convertir en array et trier par date
        const depositsArray = Object.entries(grouped)
            .map(([date, eth]) => ({
            date,
            eth,
            usd: eth * ethPriceUSD,
        }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return {
            deposits: depositsArray,
            ethPriceUSD,
        };
    }
    /**
     * Calcule le numéro de semaine
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }
}
exports.default = new AdminService();
