import { ethers } from 'ethers';
import platformConfigService from './platformConfigService';

// Adresses des contrats USDT (Ethereum Mainnet)
const USDT_CONTRACT_ADDRESS_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_CONTRACT_ADDRESS_SEPOLIA = '0x...'; // À configurer si on utilise Sepolia

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private depositWallet: ethers.Wallet | null = null;
  private platformAddress: string = '';
  private addressCache: string | null = null;
  private addressCacheExpiry: number = 0;
  private readonly CACHE_TTL = 30000; // 30 secondes

  constructor() {
    // Ne pas initialiser ici - attendre que dotenv soit chargé
    // L'initialisation se fera à la demande via ensureProvider()
  }

  /**
   * S'assure que le provider est initialisé
   */
  private ensureProvider(): void {
    if (this.provider) {
      return; // Déjà initialisé
    }

    const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
    if (!rpcUrl) {
      console.error('❌ ERROR: RPC_URL or ETH_RPC_URL not configured. Blockchain operations will fail.');
      console.error('   Please set RPC_URL or ETH_RPC_URL in your .env file');
      throw new Error('Provider not configured. Please set RPC_URL or ETH_RPC_URL in environment variables.');
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        batchMaxCount: 1,
        staticNetwork: true,
      });
      console.log(`✅ Blockchain provider created with RPC: ${rpcUrl.substring(0, 50)}...`);
      
      // Créer un wallet pour la plateforme si PLATFORM_PRIVATE_KEY est fourni (fallback)
      const privateKey = process.env.PLATFORM_PRIVATE_KEY;
      if (privateKey) {
        this.depositWallet = new ethers.Wallet(privateKey, this.provider);
        this.platformAddress = this.depositWallet.address;
        console.log(`✅ Platform wallet initialized: ${this.platformAddress.substring(0, 10)}...`);
      }
    } catch (error: any) {
      console.error('❌ Error initializing blockchain provider:', error.message || error);
      throw new Error(`Failed to initialize blockchain provider: ${error.message || error}`);
    }
  }

  /**
   * Retourne l'adresse de dépôt de la plateforme depuis la DB
   */
  async getDepositAddress(): Promise<string> {
    // Vérifier le cache
    if (this.addressCache && Date.now() < this.addressCacheExpiry) {
      return this.addressCache;
    }

    try {
      // Essayer de récupérer depuis la DB
      const dbAddress = await platformConfigService.getConfig('DEPOSIT_ADDRESS');
      
      if (dbAddress) {
        this.addressCache = dbAddress.toLowerCase();
        this.addressCacheExpiry = Date.now() + this.CACHE_TTL;
        return this.addressCache;
      }

      // Fallback sur l'adresse depuis PLATFORM_PRIVATE_KEY si disponible
      if (this.platformAddress) {
        this.addressCache = this.platformAddress.toLowerCase();
        this.addressCacheExpiry = Date.now() + this.CACHE_TTL;
        return this.addressCache;
      }

      // Si rien n'est configuré, utiliser une adresse par défaut
      const defaultAddress = '0x8af5e8943ffc8dbf373f20df191687156ce185e9';
      console.warn('⚠️  WARNING: Using default deposit address (not in DB)');
      this.addressCache = defaultAddress.toLowerCase();
      this.addressCacheExpiry = Date.now() + this.CACHE_TTL;
      return this.addressCache;
    } catch (error: any) {
      console.error('Error getting deposit address:', error);
      
      // En cas d'erreur DB, retourner l'adresse par défaut
      const defaultAddress = '0x8af5e8943ffc8dbf373f20df191687156ce185e9';
      return defaultAddress.toLowerCase();
    }
  }

  /**
   * Version synchrone pour compatibilité (avec cache)
   * NOTE: Préférer utiliser getDepositAddress() async si possible
   */
  getDepositAddressSync(): string {
    if (this.addressCache && Date.now() < this.addressCacheExpiry) {
      return this.addressCache;
    }

    if (this.platformAddress) {
      return this.platformAddress.toLowerCase();
    }

    // Fallback
    return '0x8af5e8943ffc8dbf373f20df191687156ce185e9'.toLowerCase();
  }

  /**
   * Vérifie si une transaction est un dépôt ETH
   */
  async checkETHDeposit(txHash: string, userAddress: string): Promise<{
    isDeposit: boolean;
    amount?: number;
    confirmed: boolean;
  }> {
    try {
      this.ensureProvider();
    } catch (error: any) {
      console.error('[checkETHDeposit] Provider initialization failed:', error.message);
      throw error;
    }
    
    if (!this.provider) {
      throw new Error('Provider not configured. Please set RPC_URL or ETH_RPC_URL in environment variables.');
    }

    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return { isDeposit: false, confirmed: false };
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return { isDeposit: false, confirmed: false };
      }

      // Récupérer l'adresse de dépôt actuelle
      const depositAddress = await this.getDepositAddress();

      // Vérifier que la transaction va vers l'adresse de dépôt
      if (receipt.to?.toLowerCase() !== depositAddress.toLowerCase()) {
        return { isDeposit: false, confirmed: true };
      }

      // Vérifier que la transaction vient de l'utilisateur
      if (tx.from.toLowerCase() !== userAddress.toLowerCase()) {
        return { isDeposit: false, confirmed: true };
      }

      // Récupérer le montant en ETH
      const amount = parseFloat(ethers.formatEther(tx.value || 0));

      return {
        isDeposit: true,
        amount,
        confirmed: true,
      };
    } catch (error) {
      console.error('Error checking ETH deposit:', error);
      return { isDeposit: false, confirmed: false };
    }
  }

  /**
   * Vérifie si une transaction est un dépôt USDT (ERC20)
   */
  async checkUSDTDeposit(txHash: string, userAddress: string): Promise<{
    isDeposit: boolean;
    amount?: number;
    confirmed: boolean;
  }> {
    try {
      this.ensureProvider();
    } catch (error: any) {
      console.error('[checkUSDTDeposit] Provider initialization failed:', error.message);
      throw error;
    }
    
    if (!this.provider) {
      throw new Error('Provider not configured. Please set RPC_URL or ETH_RPC_URL in environment variables.');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return { isDeposit: false, confirmed: false };
      }

      // ABI minimal pour USDT transfer
      const usdtAbi = [
        'event Transfer(address indexed from, address indexed to, uint256 value)',
      ];

      // Trouver l'adresse du contrat USDT selon le réseau
      const network = await this.provider.getNetwork();
      const usdtAddress = network.chainId === 1n 
        ? USDT_CONTRACT_ADDRESS_MAINNET 
        : USDT_CONTRACT_ADDRESS_SEPOLIA;

      const contract = new ethers.Contract(usdtAddress, usdtAbi, this.provider);

      // Analyser les événements Transfer
      const transferEvents = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((event) => event?.name === 'Transfer');

      for (const event of transferEvents) {
        if (!event) continue;

        const from = event.args[0].toLowerCase();
        const to = event.args[1].toLowerCase();
        const value = event.args[2];

        // Récupérer l'adresse de dépôt actuelle
        const depositAddress = await this.getDepositAddress();

        // Vérifier que c'est un transfer vers la plateforme
        if (
          to === depositAddress.toLowerCase() &&
          from === userAddress.toLowerCase()
        ) {
          // USDT a 6 décimales
          const amount = parseFloat(ethers.formatUnits(value, 6));
          return {
            isDeposit: true,
            amount,
            confirmed: true,
          };
        }
      }

      return { isDeposit: false, confirmed: true };
    } catch (error) {
      console.error('Error checking USDT deposit:', error);
      return { isDeposit: false, confirmed: false };
    }
  }

  /**
   * Vérifie un dépôt (ETH ou USDT)
   */
  async checkDeposit(
    txHash: string,
    userAddress: string,
    currency: 'ETH' | 'USDT'
  ): Promise<{
    isDeposit: boolean;
    amount?: number;
    confirmed: boolean;
  }> {
    if (currency === 'ETH') {
      return this.checkETHDeposit(txHash, userAddress);
    } else {
      return this.checkUSDTDeposit(txHash, userAddress);
    }
  }
}

export default new BlockchainService();

