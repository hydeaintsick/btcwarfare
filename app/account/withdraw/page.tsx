"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function WithdrawPage() {
  const { user } = useWallet();
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDT">("ETH");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawAddress, setWithdrawAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
      const result = await apiClient.withdraw(amount, selectedCurrency, withdrawAddress);
      alert(`Withdrawal request created. You will receive ${result.amount} ${result.currency} (fee: ${result.fee} ${result.currency})`);
      setWithdrawAmount("");
      setWithdrawAddress("");
    } catch (error: any) {
      alert(error.message || "Error creating withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const balance = selectedCurrency === "ETH" ? user?.balanceETH || 0 : user?.balanceUSDT || 0;
  const withdrawalFee = withdrawAmount ? parseFloat(withdrawAmount) * 0.05 : 0;
  const totalRequired = withdrawAmount ? parseFloat(withdrawAmount) + withdrawalFee : 0;

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
            <button
              onClick={() => setSelectedCurrency("USDT")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCurrency === "USDT"
                  ? "bg-neon-cyan text-black"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              USDT
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Available: {balance.toFixed(6)} {selectedCurrency}
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
              <div>Withdrawal amount: {parseFloat(withdrawAmount).toFixed(6)} {selectedCurrency}</div>
              <div>Platform fee (5%): {withdrawalFee.toFixed(6)} {selectedCurrency}</div>
              <div className="font-medium text-gray-300">Total required: {totalRequired.toFixed(6)} {selectedCurrency}</div>
              {totalRequired > balance && (
                <div className="text-red-400">⚠️ Insufficient balance</div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Destination Address</label>
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
          disabled={loading || !withdrawAmount || !withdrawAddress || totalRequired > balance}
          className="w-full px-6 py-3 bg-neon-pink text-black rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </div>
    </>
  );
}

