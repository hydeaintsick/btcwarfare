const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    // Always read from localStorage to get the latest value
    // This ensures consistency across multiple instances and after disconnect/connect
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async getChallenge(walletAddress: string) {
    return this.request<{ message: string; nonce: string }>('/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verify(walletAddress: string, signature: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature }),
    });
    this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // BTC Price
  async getBTCPrice() {
    return this.request<{ price: number; priceE8: number; source: string; timestamp: number }>('/btc/price');
  }

  // Wallet
  async getBalance() {
    return this.request<{ balanceETH: number; balanceUSDT: number }>('/wallet/balance');
  }

  async getDepositAddress() {
    return this.request<{ address: string; message: string; fee: string }>('/wallet/deposit-address');
  }

  async checkDeposit(txHash: string, currency: 'ETH' | 'USDT') {
    return this.request<{
      status: string;
      amount?: number;
      fee?: number;
      total?: number;
      currency?: string;
      newBalance?: number;
    }>('/wallet/check-deposit', {
      method: 'POST',
      body: JSON.stringify({ txHash, currency }),
    });
  }

  async getDeposits() {
    return this.request<{
      deposits: Array<{
        id: string;
        amount: number;
        currency: string;
        fee: number;
        status: string;
        txHash?: string;
        createdAt: string;
      }>;
    }>('/wallet/deposits');
  }

  async getPendingDeposits() {
    return this.request<{
      deposits: Array<{
        id: string;
        txHash?: string;
        amount: number;
        currency: string;
        fee?: number;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/wallet/pending-deposits');
  }

  async withdraw(amount: number, currency: 'ETH' | 'USDT', destinationAddress: string) {
    return this.request<{
      message: string;
      transactionId: string;
      amount: number;
      fee: number;
      total: number;
      currency: string;
      newBalance: number;
    }>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, destinationAddress }),
    });
  }

  async getTransactions() {
    return this.request<{
      transactions: Array<{
        id: string;
        type: string;
        amount: number;
        currency: string;
        fee?: number;
        status: string;
        txHash?: string;
        relatedBattleId?: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/wallet/transactions');
  }

  // Battle
  async enterBattle(position: 'long' | 'short', currency: 'ETH' | 'USDT') {
    return this.request<{
      message: string;
      battleId?: string;
      battle?: any;
      queueId?: string;
      position?: string;
    }>('/battle/enter', {
      method: 'POST',
      body: JSON.stringify({ position, currency }),
    });
  }

  async getCurrentBattle() {
    return this.request<{ battle: any | null }>('/battle/current');
  }

  async getBattleHistory() {
    return this.request<{
      battles: Array<any>;
    }>('/battle/history');
  }

  async resolveBattle(battleId: string) {
    return this.request<{ message: string; battle: any }>(`/battle/resolve/${battleId}`, {
      method: 'POST',
    });
  }

  // Topup
  async initiateTopup(amount: number, currency: 'ETH' | 'USDT') {
    return this.request<{
      depositAddress: string;
      amount: number;
      currency: string;
      fee: number;
      amountAfterFee: number;
    }>('/wallet/initiate-topup', {
      method: 'POST',
      body: JSON.stringify({ amount, currency }),
    });
  }

  async watchTopupTransaction(txHash: string, currency: 'ETH' | 'USDT') {
    return this.request<{
      status: 'pending' | 'confirmed' | 'failed';
      amount?: number;
      fee?: number;
      amountAfterFee?: number;
      newBalance?: number;
    }>('/wallet/watch-topup', {
      method: 'POST',
      body: JSON.stringify({ txHash, currency }),
    });
  }
}

export const apiClient = new ApiClient();

