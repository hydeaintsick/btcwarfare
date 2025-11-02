"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function BalancePage() {
  const { user, refreshUser } = useWallet();
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDT">(
    "ETH"
  );
  const [txHash, setTxHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);

  const loadPendingDeposits = useCallback(async () => {
    try {
      const data = await apiClient.getPendingDeposits();
      setPendingDeposits(data.deposits);
    } catch (error) {
      console.error("Error loading pending deposits:", error);
    }
  }, []);

  const loadDepositAddress = useCallback(async () => {
    try {
      const data = await apiClient.getDepositAddress();
      setDepositAddress(data.address);
    } catch (error) {
      console.error("Error loading deposit address:", error);
      // Show user-friendly error
      setDepositAddress(
        "Error loading address. Please ensure you are connected."
      );
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Rafraîchir les données utilisateur à chaque fois qu'on arrive sur la page
      refreshUser();
      loadDepositAddress();
      loadPendingDeposits();
    }
  }, [user, refreshUser, loadDepositAddress, loadPendingDeposits]);

  const handleCheckDeposit = async () => {
    if (!txHash || !selectedCurrency) {
      alert("Please enter transaction hash and select currency");
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.checkDeposit(txHash, selectedCurrency);
      alert(
        `Deposit ${result.status === "completed" ? "confirmed" : result.status}`
      );
      if (result.status === "completed") {
        setTxHash("");
        // Refresh user data and pending deposits
        await refreshUser();
        loadPendingDeposits();
      }
    } catch (error: any) {
      alert(error.message || "Error checking deposit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold neon-text">Balance & Top-up</h2>
        <Link
          href="/account/topup"
          className="px-6 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan"
        >
          Top-up Now
        </Link>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-6 w-full"
        >
          <div className="text-sm text-gray-400 mb-2">ETH Balance</div>
          <div className="text-4xl font-bold neon-cyan">
            {(user?.balanceETH || 0).toFixed(10)} ETH
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total (deposits + winnings/losses)
          </div>
        </motion.div>
        {/* <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-6"
        >
          <div className="text-sm text-gray-400 mb-2">USDT Balance</div>
          <div className="text-4xl font-bold neon-pink">
            {(user?.balanceUSDT || 0).toFixed(2)} USDT
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Total (deposits + winnings/losses)
          </div>
        </motion.div> */}
      </div>

      {/* Top-up Section */}
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
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Deposit Address
          </label>
          <div className="glass rounded-lg p-4 flex items-center justify-between">
            <code className="text-sm font-mono break-all pr-4">
              {depositAddress || "Loading..."}
            </code>
            <button
              onClick={() => {
                if (depositAddress) {
                  navigator.clipboard.writeText(depositAddress);
                  alert("Address copied!");
                }
              }}
              className="px-4 py-2 bg-neon-cyan text-black rounded-lg font-medium hover:bg-opacity-90 whitespace-nowrap"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Platform fee: 5% on all deposits. Send {selectedCurrency} to this
            address.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Check Deposit (Transaction Hash)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="flex-1 glass rounded-lg px-4 py-2 text-white placeholder-gray-500"
            />
            <button
              onClick={handleCheckDeposit}
              disabled={loading}
              className="px-6 py-2 bg-neon-cyan text-black rounded-lg font-medium hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check"}
            </button>
          </div>
        </div>

        {/* Pending Deposits */}
        {pendingDeposits.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 neon-text">
              Recent Deposits
            </h3>
            <div className="space-y-3">
              {pendingDeposits.map((deposit) => (
                <motion.div
                  key={deposit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          deposit.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : deposit.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {deposit.status === "completed"
                          ? "✓ Completed"
                          : deposit.status === "pending"
                          ? "⏳ Pending"
                          : "✗ Failed"}
                      </span>
                      <span className="text-sm text-gray-400">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {deposit.txHash && (
                      <code className="text-xs text-gray-400 font-mono break-all">
                        {deposit.txHash.slice(0, 20)}...
                        {deposit.txHash.slice(-10)}
                      </code>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        deposit.currency === "ETH" ? "neon-cyan" : "neon-pink"
                      }`}
                    >
                      +{deposit.amount.toFixed(10)} {deposit.currency}
                    </div>
                    {deposit.fee && (
                      <div className="text-xs text-gray-400">
                        Fee: {deposit.fee.toFixed(10)} {deposit.currency}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Auto-Detection Info */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Auto-Detection Enabled:</strong> Your deposits are
            automatically detected and credited to your account within 30
            seconds. You can also manually check a transaction using the form
            above.
          </p>
        </div>
      </div>
    </div>
  );
}
