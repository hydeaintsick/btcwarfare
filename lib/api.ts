const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    // Always read from localStorage to get the latest value
    // This ensures consistency across multiple instances and after disconnect/connect
    return localStorage.getItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async getChallenge(walletAddress: string) {
    return this.request<{ message: string; nonce: string }>("/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verify(walletAddress: string, signature: string) {
    const result = await this.request<{ token: string; user: any }>(
      "/auth/verify",
      {
        method: "POST",
        body: JSON.stringify({ walletAddress, signature }),
      }
    );
    this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request<{ user: any }>("/auth/me");
  }

  // BTC Price
  async getBTCPrice() {
    return this.request<{
      price: number;
      priceE8: number;
      source: string;
      timestamp: number;
    }>("/btc/price");
  }

  // Wallet
  async getBalance() {
    return this.request<{ balanceETH: number; balanceUSDT: number }>(
      "/wallet/balance"
    );
  }

  async getDepositAddress() {
    return this.request<{ address: string; message: string; fee: string }>(
      "/wallet/deposit-address"
    );
  }

  async checkDeposit(txHash: string, currency: "ETH" | "USDT") {
    return this.request<{
      status: string;
      amount?: number;
      fee?: number;
      total?: number;
      currency?: string;
      newBalance?: number;
    }>("/wallet/check-deposit", {
      method: "POST",
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
    }>("/wallet/deposits");
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
    }>("/wallet/pending-deposits");
  }

  async withdraw(
    amount: number,
    currency: "ETH" | "USDT",
    destinationAddress: string
  ) {
    return this.request<{
      message: string;
      transactionId: string;
      amount: number;
      fee: number;
      total: number;
      currency: string;
      newBalance: number;
    }>("/wallet/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, currency, destinationAddress }),
    });
  }

  async cancelWithdrawal(id: string) {
    return this.request<{
      message: string;
      transactionId: string;
      newBalance: number;
    }>(`/wallet/withdraw/${id}/cancel`, {
      method: "POST",
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
        rejectionReason?: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>("/wallet/transactions");
  }

  // Battle
  async enterBattle(position: "long" | "short", currency: "ETH" | "USDT") {
    return this.request<{
      message: string;
      battleId?: string;
      battle?: any;
      queueId?: string;
      position?: string;
    }>("/battle/enter", {
      method: "POST",
      body: JSON.stringify({ position, currency }),
    });
  }

  async getCurrentBattle() {
    return this.request<{ battle: any | null }>("/battle/current");
  }

  async getBattleHistory() {
    return this.request<{
      battles: Array<any>;
    }>("/battle/history");
  }

  async resolveBattle(battleId: string) {
    return this.request<{ message: string; battle: any }>(
      `/battle/resolve/${battleId}`,
      {
        method: "POST",
      }
    );
  }

  // Topup
  async initiateTopup(amount: number, currency: "ETH" | "USDT") {
    return this.request<{
      depositAddress: string;
      amount: number;
      currency: string;
      fee: number;
      amountAfterFee: number;
    }>("/wallet/initiate-topup", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });
  }

  async watchTopupTransaction(txHash: string, currency: "ETH" | "USDT") {
    return this.request<{
      status: "pending" | "confirmed" | "failed";
      amount?: number;
      fee?: number;
      amountAfterFee?: number;
      newBalance?: number;
    }>("/wallet/watch-topup", {
      method: "POST",
      body: JSON.stringify({ txHash, currency }),
    });
  }

  // Admin
  async adminLogin(email: string, password: string) {
    const result = await this.request<{
      token: string;
      email: string;
      message: string;
    }>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    // Stocker le token admin séparément
    if (result.token) {
      localStorage.setItem("admin_token", result.token);
    }
    return result;
  }

  getAdminToken(): string | null {
    return localStorage.getItem("admin_token");
  }

  setAdminToken(token: string | null) {
    if (token) {
      localStorage.setItem("admin_token", token);
    } else {
      localStorage.removeItem("admin_token");
    }
  }

  private async adminRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const adminToken = this.getAdminToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAdminDashboard() {
    return this.adminRequest<{
      totalUsers: number;
      averageDepositPerUser: number;
      platformFunds: {
        eth: number;
        usd: number;
      };
      userBalancesOwed: {
        eth: number;
        usd: number;
      };
      netPosition: {
        eth: number;
        usd: number;
      };
      recentTransactions: Array<any>;
      ethPriceUSD: number;
    }>("/admin/dashboard");
  }

  async getAdminDepositsChart(period: "day" | "week" | "month" = "day") {
    return this.adminRequest<{
      deposits: Array<{
        date: string;
        eth: number;
        usd: number;
      }>;
      ethPriceUSD: number;
    }>(`/admin/deposits-chart?period=${period}`);
  }

  async getAdminTransactions(filters?: {
    type?: string;
    status?: string;
    currency?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.type) params.append("type", filters.type);
      if (filters.status) params.append("status", filters.status);
      if (filters.currency) params.append("currency", filters.currency);
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.offset) params.append("offset", filters.offset.toString());
    }
    const queryString = params.toString();
    return this.adminRequest<{
      transactions: Array<any>;
      total: number;
      limit: number;
      offset: number;
    }>(`/admin/transactions${queryString ? `?${queryString}` : ""}`);
  }

  async getAdminWithdrawals() {
    return this.adminRequest<{
      withdrawals: Array<{
        id: string;
        userId: any;
        amount: number;
        currency: string;
        fee: number;
        status: string;
        destinationAddress: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>("/admin/withdrawals");
  }

  async approveWithdrawal(id: string) {
    return this.adminRequest<{
      message: string;
      transactionId: string;
      txHash: string;
      amount: number;
      fee: number;
      total: number;
      currency: string;
    }>(`/admin/withdrawals/${id}/approve`, {
      method: "POST",
    });
  }

  async rejectWithdrawal(id: string, reason?: string) {
    return this.adminRequest<{
      message: string;
      transactionId: string;
      reason?: string;
    }>(`/admin/withdrawals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }
}

export const apiClient = new ApiClient();
