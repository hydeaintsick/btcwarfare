"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function WithdrawPage() {
  const { user, refreshUser } = useWallet();
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDT">(
    "ETH"
  );
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingWithdrawals();
  }, []);

  const loadPendingWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const data = await apiClient.getTransactions();
      const withdrawals = data.transactions.filter(
        (tx: any) => tx.type === "withdrawal" && tx.status === "pending"
      );
      setPendingWithdrawals(withdrawals);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress || !selectedCurrency) {
      alert("Please fill all fields");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.withdraw(
        amount,
        selectedCurrency,
        withdrawAddress
      );
      alert(
        `Withdrawal request created. You will receive ${result.amount} ${result.currency} (fee: ${result.fee} ${result.currency})`
      );
      setWithdrawAmount("");
      setWithdrawAddress("");
      await loadPendingWithdrawals(); // Recharger la liste
      await refreshUser(); // Rafraîchir le solde
    } catch (error: any) {
      alert(error.message || "Error creating withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this withdrawal?")) {
      return;
    }

    setCancellingId(id);
    try {
      await apiClient.cancelWithdrawal(id);
      alert("Withdrawal cancelled successfully");
      await loadPendingWithdrawals(); // Recharger la liste
      await refreshUser(); // Rafraîchir le solde
    } catch (error: any) {
      alert(error.message || "Error cancelling withdrawal");
    } finally {
      setCancellingId(null);
    }
  };

  const balance =
    selectedCurrency === "ETH" ? user?.balanceETH || 0 : user?.balanceUSDT || 0;
  const withdrawalFee = withdrawAmount ? parseFloat(withdrawAmount) * 0.05 : 0;
  const totalRequired = withdrawAmount
    ? parseFloat(withdrawAmount) + withdrawalFee
    : 0;

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 neon-text">Withdraw</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Currency</label>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedCurrency("ETH")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCurrency === "ETH"
                  ? "bg-neon-cyan text-black"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              ETH
            </button>
            {/* <button
              onClick={() => setSelectedCurrency("USDT")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCurrency === "USDT"
                  ? "bg-neon-cyan text-black"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              USDT
            </button> */}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Available: {balance.toFixed(10)} {selectedCurrency}
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount</label>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="0.0"
            step="0.0001"
            className="w-full glass rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
          {withdrawAmount && (
            <div className="mt-2 space-y-1 text-xs text-gray-400">
              <div>
                Withdrawal amount: {parseFloat(withdrawAmount).toFixed(10)}{" "}
                {selectedCurrency}
              </div>
              <div>
                Platform fee (5%): {withdrawalFee.toFixed(10)}{" "}
                {selectedCurrency}
              </div>
              <div className="font-medium text-gray-300">
                Total required: {totalRequired.toFixed(10)} {selectedCurrency}
              </div>
              {totalRequired > balance && (
                <div className="text-red-400">⚠️ Insufficient balance</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Destination Address
          </label>
          <input
            type="text"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            placeholder="0x..."
            className="w-full glass rounded-lg px-4 py-2 text-white placeholder-gray-500"
          />
        </div>

        <button
          onClick={handleWithdraw}
          disabled={
            loading ||
            !withdrawAmount ||
            !withdrawAddress ||
            totalRequired > balance
          }
          className="w-full px-6 py-3 bg-neon-pink text-black rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </div>

      {/* Pending Withdrawals Section */}
      {(pendingWithdrawals.length > 0 || loadingWithdrawals) && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 neon-text">
            Pending Withdrawals
          </h3>
          {loadingWithdrawals ? (
            <p className="text-gray-400 text-center py-4">Loading...</p>
          ) : pendingWithdrawals.length > 0 ? (
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="glass rounded-lg p-4 border border-yellow-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          {(withdrawal.amount - (withdrawal.fee || 0)).toFixed(
                            10
                          )}{" "}
                          {withdrawal.currency}
                        </span>
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                          {withdrawal.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>
                          Total debited: {withdrawal.amount.toFixed(10)}{" "}
                          {withdrawal.currency}
                        </div>
                        <div>
                          Fee: {withdrawal.fee?.toFixed(10) || "0"}{" "}
                          {withdrawal.currency}
                        </div>
                        <div>
                          To: {withdrawal.txHash?.substring(0, 10)}...
                          {withdrawal.txHash?.substring(
                            withdrawal.txHash.length - 8
                          )}
                        </div>
                        <div>
                          Created:{" "}
                          {new Date(withdrawal.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelWithdrawal(withdrawal.id)}
                      disabled={cancellingId === withdrawal.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-4"
                    >
                      {cancellingId === withdrawal.id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              No pending withdrawals
            </p>
          )}
        </div>
      )}
    </>
  );
}
