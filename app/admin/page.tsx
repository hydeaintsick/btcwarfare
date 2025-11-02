"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDashboardStats, useDepositsChart, useWithdrawals } from "@/hooks/useAdminAPI";
import { apiClient } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Vérifier si l'admin est déjà authentifié
  useEffect(() => {
    const adminToken = apiClient.getAdminToken();
    if (adminToken) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await apiClient.adminLogin(email, password);
      setIsAuthenticated(true);
    } catch (error: any) {
      setLoginError(error.message || "Invalid credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    apiClient.setAdminToken(null);
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
  };

  // Page de login
  if (isLoading) {
    return (
      <main className="min-h-screen animated-gradient relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen animated-gradient relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-blur-pulse" />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-blur-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-20"
          >
            <div className="glass-strong rounded-xl p-8">
              <h1 className="text-4xl font-bold mb-6 neon-text neon-cyan text-center">
                Admin Login
              </h1>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
                    placeholder="••••••••"
                  />
                </div>
                {loginError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {loginError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full px-6 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <AdminDashboard onLogout={handleLogout} />
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "withdrawals">("dashboard");
  const [chartPeriod, setChartPeriod] = useState<"day" | "week" | "month">("day");

  const { stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { chartData, isLoading: chartLoading } = useDepositsChart(chartPeriod);
  const {
    withdrawals,
    isLoading: withdrawalsLoading,
    approveWithdrawal,
    rejectWithdrawal,
  } = useWithdrawals();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this withdrawal?")) return;
    
    try {
      setProcessingId(id);
      await approveWithdrawal(id);
      alert("Withdrawal approved successfully!");
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to approve withdrawal"}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return; // User cancelled
    
    try {
      setProcessingId(id);
      await rejectWithdrawal(id, reason || undefined);
      alert("Withdrawal rejected successfully!");
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to reject withdrawal"}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-blur-pulse" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-blur-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-4 neon-text neon-cyan">
              Admin <span className="neon-pink">Dashboard</span>
            </h1>
            <p className="text-sm text-gray-400">Manage platform finances and withdrawals</p>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all"
          >
            Logout
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "dashboard"
                ? "border-b-2 border-neon-cyan text-neon-cyan"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === "withdrawals"
                ? "border-b-2 border-neon-cyan text-neon-cyan"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Withdrawals
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {statsLoading ? (
              <div className="text-center py-20">
                <div className="animate-pulse text-gray-400">Loading dashboard...</div>
              </div>
            ) : statsError ? (
              <div className="text-center py-20">
                <p className="text-red-400">Error loading dashboard</p>
                <p className="text-gray-400 text-sm mt-2">{statsError.message}</p>
              </div>
            ) : stats ? (
              <>
                {/* KPIs */}
                <div className="grid md:grid-cols-5 gap-6">
                  <div className="glass-strong rounded-xl p-6">
                    <div className="text-xs text-gray-400 mb-2">Total Users</div>
                    <div className="text-xl font-bold neon-cyan">
                      {stats.totalUsers.toLocaleString()}
                    </div>
                  </div>
                  <div className="glass-strong rounded-xl p-6">
                    <div className="text-xs text-gray-400 mb-2">Avg Deposit/User</div>
                    <div className="text-lg font-bold neon-pink">
                      {stats.averageDepositPerUser.toFixed(10)} ETH
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${(stats.averageDepositPerUser * stats.ethPriceUSD).toFixed(2)}
                    </div>
                  </div>
                  <div className="glass-strong rounded-xl p-6">
                    <div className="text-xs text-gray-400 mb-2">Platform Funds</div>
                    <div className="text-lg font-bold neon-cyan">
                      {stats.platformFunds.eth.toFixed(10)} ETH
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${stats.platformFunds.usd.toFixed(2)}
                    </div>
                  </div>
                  <div className="glass-strong rounded-xl p-6">
                    <div className="text-xs text-gray-400 mb-2">User Balances Owed</div>
                    <div className="text-lg font-bold neon-pink">
                      {stats.userBalancesOwed.eth.toFixed(10)} ETH
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${stats.userBalancesOwed.usd.toFixed(2)}
                    </div>
                  </div>
                  <div className="glass-strong rounded-xl p-6">
                    <div className="text-xs text-gray-400 mb-2">Net Position</div>
                    <div
                      className={`text-lg font-bold ${
                        stats.netPosition.eth >= 0 ? "neon-cyan" : "text-red-400"
                      }`}
                    >
                      {stats.netPosition.eth >= 0 ? "+" : ""}
                      {stats.netPosition.eth.toFixed(10)} ETH
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {stats.netPosition.usd >= 0 ? "+" : ""}$
                      {stats.netPosition.usd.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Deposits Chart */}
                <div className="glass-strong rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold neon-text">Deposits Chart</h2>
                    <div className="flex gap-2">
                      {(["day", "week", "month"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setChartPeriod(period)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            chartPeriod === period
                              ? "bg-neon-cyan text-black"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {chartLoading ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="animate-pulse text-gray-400">Loading chart...</div>
                    </div>
                  ) : chartData && chartData.deposits.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.deposits}>
                          <defs>
                            <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="#00ffff"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#00ffff"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" stroke="#888" tick={{ fill: "#888", fontSize: 12 }} />
                          <YAxis
                            stroke="#888"
                            tick={{ fill: "#888", fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(0, 0, 0, 0.9)",
                              border: "1px solid #00ffff",
                              borderRadius: "8px",
                              color: "#fff",
                            }}
                            formatter={(value: number) => [
                              `$${value.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`,
                              "Deposits USD",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="usd"
                            stroke="#00ffff"
                            strokeWidth={2}
                            fill="url(#colorDeposits)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      No deposit data available
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                <div className="glass-strong rounded-xl p-6">
                  <h2 className="text-xl font-bold neon-text mb-6">Recent Transactions</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400">Type</th>
                          <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-400">Status</th>
                          <th className="text-left py-3 px-4 text-gray-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentTransactions.slice(0, 10).map((tx: any) => (
                          <tr
                            key={tx.id}
                            className="border-b border-gray-800 hover:bg-gray-900/50"
                          >
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  tx.type === "deposit"
                                    ? "bg-green-500/20 text-green-400"
                                    : tx.type === "win"
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {tx.currency === "ETH"
                                ? tx.amount?.toFixed(10) || "0.0000000000"
                                : tx.amount?.toFixed(4) || "0"}{" "}
                              {tx.currency}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  tx.status === "completed"
                                    ? "bg-green-500/20 text-green-400"
                                    : tx.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === "withdrawals" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {withdrawalsLoading ? (
              <div className="text-center py-20">
                <div className="animate-pulse text-gray-400">Loading withdrawals...</div>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="glass-strong rounded-xl p-12 text-center">
                <p className="text-xl text-gray-400">No pending withdrawals</p>
              </div>
            ) : (
              <div className="glass-strong rounded-xl p-6">
                <h2 className="text-xl font-bold neon-text mb-6">
                  Pending Withdrawals ({withdrawals.length})
                </h2>
                <div className="space-y-4">
                  {withdrawals.map((withdrawal: any) => (
                    <div
                      key={withdrawal.id}
                      className="glass rounded-xl p-6 border border-gray-700"
                    >
                      <div className="grid md:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">User</div>
                          <div className="font-mono text-sm">
                            {withdrawal.userId?.walletAddress?.substring(0, 10)}...
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Amount</div>
                          <div className="text-sm font-bold neon-cyan">
                            {withdrawal.currency === "ETH"
                              ? withdrawal.amount?.toFixed(10)
                              : withdrawal.amount?.toFixed(4)}{" "}
                            {withdrawal.currency}
                          </div>
                          {stats && (
                            <div className="text-xs text-gray-500 mt-1">
                              ${(withdrawal.amount * stats.ethPriceUSD).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Destination</div>
                          <div className="font-mono text-xs break-all">
                            {withdrawal.destinationAddress}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(withdrawal.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === withdrawal.id ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}

