import { ethers } from 'ethers';

// Adresses des contrats USDT (Ethereum Mainnet)
const USDT_CONTRACT_ADDRESS_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_CONTRACT_ADDRESS_SEPOLIA = '0x...'; // À configurer si on utilise Sepolia

class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private depositWallet: ethers.Wallet | null = null;
  private platformAddress: string = '';

  constructor() {
    // Initialiser avec les variables d'environnement
    const rpcUrl = process.env.RPC_URL || process.env.ETH_RPC_URL;
    if (rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Créer un wallet pour la plateforme (pour recevoir les dépôts)
      const privateKey = process.env.PLATFORM_PRIVATE_KEY;
      if (privateKey) {
        this.depositWallet = new ethers.Wallet(privateKey, this.provider);
        this.platformAddress = this.depositWallet.address;
      }
    }
  }

  /**
   * Retourne l'adresse de dépôt de la plateforme
   */
  getDepositAddress(): string {
    if (!this.platformAddress) {
      throw new Error('Platform wallet not configured');
    }
    return this.platformAddress;
  }

  /**
   * Vérifie si une transaction est un dépôt ETH
   */
  async checkETHDeposit(txHash: string, userAddress: string): Promise<{
    isDeposit: boolean;
    amount?: number;
    confirmed: boolean;
  }> {
    if (!this.provider) {
      throw new Error('Provider not configured');
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

      // Vérifier que la transaction va vers l'adresse de dépôt
      if (receipt.to?.toLowerCase() !== this.platformAddress.toLowerCase()) {
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
    if (!this.provider) {
      throw new Error('Provider not configured');
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

        // Vérifier que c'est un transfer vers la plateforme
        if (
          to === this.platformAddress.toLowerCase() &&
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

