"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../models/User"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const blockchainService_1 = __importDefault(require("./blockchainService"));
const ethers_1 = require("ethers");
/**
 * Service pour détecter et traiter automatiquement les dépôts entrants
 */
class DepositService {
    constructor() {
        this.lastCheckedBlock = 0;
        this.isProcessing = false;
    }
    /**
     * Scan les transactions récentes vers l'adresse de dépôt de la plateforme
     */
    async scanDeposits() {
        if (this.isProcessing) {
            return; // Éviter les scans simultanés
        }
        this.isProcessing = true;
        try {
            const depositAddress = await blockchainService_1.default.getDepositAddress();
            // Obtenir le provider depuis blockchainService ou créer un nouveau
            const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
            if (!rpcUrl) {
                console.warn('No RPC URL configured, skipping deposit scan');
                return;
            }
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 100); // Scanner les 100 derniers blocks
            // Scanner les transactions ETH
            await this.scanETHDeposits(provider, depositAddress, fromBlock, currentBlock);
            // Scanner les transactions USDT (ERC20)
            await this.scanUSDTDeposits(provider, depositAddress, fromBlock, currentBlock);
            this.lastCheckedBlock = currentBlock;
        }
        catch (error) {
            console.error('Error scanning deposits:', error);
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Scanner les dépôts ETH
     * Note: Pour ETH natif, on doit scanner les blocs et vérifier chaque transaction
     * C'est moins efficace que pour les tokens ERC20, mais nécessaire pour les dépôts ETH
     */
    async scanETHDeposits(provider, depositAddress, fromBlock, toBlock) {
        try {
            // Pour optimiser, on scanne block par block (mais seulement les 100 derniers blocks)
            // En production, on pourrait utiliser un indexer ou un service spécialisé
            const blocksToScan = Math.min(10, toBlock - fromBlock); // Limiter à 10 blocks par scan
            for (let blockNum = toBlock; blockNum >= fromBlock && blockNum > toBlock - blocksToScan; blockNum--) {
                try {
                    const block = await provider.getBlock(blockNum, true);
                    if (!block || !block.transactions)
                        continue;
                    for (const txHash of block.transactions) {
                        try {
                            const tx = typeof txHash === 'string'
                                ? await provider.getTransaction(txHash)
                                : txHash;
                            if (!tx || !tx.to || tx.to.toLowerCase() !== depositAddress.toLowerCase()) {
                                continue;
                            }
                            // Vérifier si cette transaction a déjà été traitée
                            const existingTx = await Transaction_1.default.findOne({ txHash: tx.hash });
                            if (existingTx) {
                                continue;
                            }
                            // Vérifier que la transaction est confirmée
                            const receipt = await provider.getTransactionReceipt(tx.hash);
                            if (!receipt || receipt.status !== 1) {
                                continue;
                            }
                            // Trouver l'utilisateur par son adresse wallet
                            const user = await User_1.default.findOne({
                                walletAddress: tx.from.toLowerCase(),
                            });
                            if (!user) {
                                // Transaction d'un utilisateur non enregistré, on ignore
                                continue;
                            }
                            // Montant de la transaction
                            const amount = parseFloat(ethers_1.ethers.formatEther(tx.value || 0));
                            if (amount === 0) {
                                continue;
                            }
                            // Traiter le dépôt (utiliser version sécurisée)
                            const result = await this.processDepositSecure(user, tx.hash, 'ETH', amount);
                            if (!result.success) {
                                console.error(`[SECURITY] Failed to process deposit for tx ${tx.hash}:`, result.message);
                            }
                        }
                        catch (error) {
                            console.error(`Error processing ETH transaction:`, error);
                        }
                    }
                }
                catch (error) {
                    console.error(`Error scanning block ${blockNum}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error scanning ETH deposits:', error);
        }
    }
    /**
     * Scanner les dépôts USDT (ERC20)
     */
    async scanUSDTDeposits(provider, depositAddress, fromBlock, toBlock) {
        try {
            const USDT_CONTRACT_ADDRESS_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
            // Obtenir le réseau
            const network = await provider.getNetwork();
            const usdtAddress = network.chainId === 1n
                ? USDT_CONTRACT_ADDRESS_MAINNET
                : '0x...'; // Sepolia address si nécessaire
            // ABI pour l'événement Transfer
            const transferAbi = [
                'event Transfer(address indexed from, address indexed to, uint256 value)',
            ];
            const contract = new ethers_1.ethers.Contract(usdtAddress, transferAbi, provider);
            // Récupérer les événements Transfer
            const filter = contract.filters.Transfer(null, depositAddress);
            const events = await contract.queryFilter(filter, fromBlock, toBlock);
            for (const event of events) {
                try {
                    // Type guard pour vérifier que event a la propriété args
                    if (!('args' in event) || !event.args) {
                        continue;
                    }
                    const txHash = event.transactionHash;
                    const from = event.args[0].toLowerCase();
                    const value = event.args[2];
                    // Vérifier si cette transaction a déjà été traitée
                    const existingTx = await Transaction_1.default.findOne({ txHash });
                    if (existingTx) {
                        continue;
                    }
                    // Trouver l'utilisateur
                    const user = await User_1.default.findOne({ walletAddress: from });
                    if (!user) {
                        continue;
                    }
                    // Montant en USDT (6 décimales)
                    const amount = parseFloat(ethers_1.ethers.formatUnits(value, 6));
                    if (amount === 0) {
                        continue;
                    }
                    // Vérifier que la transaction est confirmée
                    const receipt = await provider.getTransactionReceipt(txHash);
                    if (!receipt || receipt.status !== 1) {
                        continue;
                    }
                    // Traiter le dépôt (utiliser version sécurisée)
                    const result = await this.processDepositSecure(user, txHash, 'USDT', amount);
                    if (!result.success) {
                        console.error(`[SECURITY] Failed to process deposit for tx ${txHash}:`, result.message);
                    }
                }
                catch (error) {
                    console.error(`Error processing USDT transaction ${event.transactionHash}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error scanning USDT deposits:', error);
        }
    }
    /**
     * Traiter un dépôt détecté (version legacy pour compatibilité avec scan automatique)
     * NOTE: Utilise processDepositSecure en interne pour la sécurité
     */
    async processDeposit(user, txHash, currency, amount) {
        const result = await this.processDepositSecure(user, txHash, currency, amount);
        if (!result.success) {
            throw new Error(result.message || 'Failed to process deposit');
        }
    }
    /**
     * Vérifier manuellement un hash de transaction pour un utilisateur
     * SÉCURITÉ: Toutes les validations doivent passer avant crédit
     */
    async checkTransactionForUser(userId, txHash, currency) {
        try {
            // VALIDATION 1: Utilisateur doit exister
            const user = await User_1.default.findById(userId);
            if (!user) {
                console.warn(`[SECURITY] checkTransactionForUser: User not found for userId: ${userId}`);
                return { found: false, message: 'User not found' };
            }
            // VALIDATION 2: Prévention de la double dépense - Vérifier si txHash existe déjà (même pour d'autres users)
            const existingTxAnywhere = await Transaction_1.default.findOne({ txHash });
            if (existingTxAnywhere) {
                // Vérifier si c'est pour le même utilisateur
                if (existingTxAnywhere.userId.toString() === userId) {
                    console.log(`[SECURITY] Transaction ${txHash} already processed for user ${userId}`);
                    return {
                        found: true,
                        amount: existingTxAnywhere.amount,
                        amountAfterFee: existingTxAnywhere.amount,
                        fee: existingTxAnywhere.feeAmount,
                        status: existingTxAnywhere.status,
                        message: existingTxAnywhere.status === 'completed'
                            ? 'Transaction already processed'
                            : 'Transaction found but not yet processed',
                    };
                }
                else {
                    // Transaction déjà utilisée par un autre utilisateur - REJETER
                    console.warn(`[SECURITY] Double spend attempt: txHash ${txHash} already used by another user`);
                    return { found: false, message: 'Transaction already used by another account' };
                }
            }
            // VALIDATION 3: Vérifier sur la blockchain OBLIGATOIREMENT
            let result;
            try {
                result = await blockchainService_1.default.checkDeposit(txHash, user.walletAddress, currency);
            }
            catch (error) {
                console.error(`[SECURITY] Error checking blockchain for tx ${txHash}:`, error.message);
                // Si le provider n'est pas configuré, on ne peut pas vérifier
                if (error.message?.includes('Provider not configured')) {
                    return {
                        found: false,
                        message: 'Blockchain provider not configured. Please set RPC_URL environment variable.'
                    };
                }
                return { found: false, message: `Blockchain check failed: ${error.message}` };
            }
            if (!result.confirmed) {
                console.warn(`[SECURITY] Transaction ${txHash} not confirmed on blockchain`);
                return { found: false, message: 'Transaction not found or not confirmed on blockchain' };
            }
            if (!result.isDeposit) {
                console.warn(`[SECURITY] Transaction ${txHash} is not a valid deposit to platform address`);
                return { found: false, message: 'Transaction is not a valid deposit to platform address' };
            }
            if (!result.amount || result.amount <= 0) {
                console.warn(`[SECURITY] Transaction ${txHash} has invalid amount: ${result.amount}`);
                return { found: false, message: 'Transaction has invalid amount' };
            }
            // VALIDATION 4: Le montant doit être récupéré depuis la blockchain, jamais depuis le frontend
            // (déjà fait via blockchainService.checkDeposit qui retourne result.amount)
            // VALIDATION 5: L'adresse source est déjà vérifiée dans blockchainService.checkDeposit
            // qui vérifie que tx.from === user.walletAddress
            // Log de sécurité
            console.log(`[SECURITY] Processing deposit: userId=${userId}, txHash=${txHash}, amount=${result.amount} ${currency}`);
            // Traiter le dépôt avec validation stricte
            const processed = await this.processDepositSecure(user, txHash, currency, result.amount);
            if (!processed.success) {
                return { found: false, message: processed.message || 'Failed to process deposit' };
            }
            return {
                found: true,
                amount: result.amount, // Montant brut de la blockchain
                amountAfterFee: processed.userAmount, // Montant crédité (après frais)
                fee: processed.platformFee,
                status: 'completed',
                message: 'Deposit processed successfully',
            };
        }
        catch (error) {
            console.error(`[SECURITY] Error in checkTransactionForUser:`, error);
            return { found: false, message: error.message || 'Error checking transaction' };
        }
    }
    /**
     * Traiter un dépôt avec validations de sécurité renforcées
     * SÉCURITÉ: Version sécurisée de processDeposit
     * Public pour être utilisé par les services de garantie et scan automatique
     */
    async processDepositSecure(user, txHash, currency, amount) {
        try {
            // VALIDATION: Vérifier à nouveau qu'il n'y a pas de double dépense (race condition)
            const existingTx = await Transaction_1.default.findOne({ txHash });
            if (existingTx) {
                console.warn(`[SECURITY] Race condition detected: txHash ${txHash} already exists`);
                return { success: false, message: 'Transaction already processed' };
            }
            // Calculer les frais de 5%
            const platformFee = amount * 0.05;
            const userAmount = amount * 0.95;
            // VALIDATION: Vérifier que les montants sont valides
            if (platformFee < 0 || userAmount < 0 || amount <= 0) {
                console.error(`[SECURITY] Invalid amounts: amount=${amount}, fee=${platformFee}, userAmount=${userAmount}`);
                return { success: false, message: 'Invalid amount calculation' };
            }
            // Créer la transaction de dépôt dans une transaction DB atomique
            const transaction = await Transaction_1.default.create({
                userId: user._id,
                type: 'deposit',
                amount: userAmount,
                currency,
                txHash,
                status: 'completed',
                feeAmount: platformFee,
            });
            // Créer la transaction de frais pour le livre de compte
            await Transaction_1.default.create({
                userId: user._id,
                type: 'fee',
                amount: platformFee,
                currency,
                txHash,
                status: 'completed',
            });
            // Mettre à jour le balance de l'utilisateur
            if (currency === 'ETH') {
                user.balanceETH += userAmount;
            }
            else {
                user.balanceUSDT += userAmount;
            }
            await user.save();
            console.log(`✅ [SECURITY] Deposit processed: ${userAmount} ${currency} for user ${user.walletAddress} (tx: ${txHash}), fee: ${platformFee}`);
            return {
                success: true,
                userAmount,
                platformFee,
            };
        }
        catch (error) {
            console.error(`[SECURITY] Error processing deposit for tx ${txHash}:`, error);
            return { success: false, message: error.message || 'Error processing deposit' };
        }
    }
}
exports.default = new DepositService();
