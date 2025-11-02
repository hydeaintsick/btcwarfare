"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function BalancePage() {
  const { user } = useWallet();
  const [balanceETH, setBalanceETH] = useState<number>(0);
  const [balanceUSDT, setBalanceUSDT] = useState<number>(0);

  useEffect(() => {
    if (user) {
      setBalanceETH(user.balanceETH);
      setBalanceUSDT(user.balanceUSDT);
    }
  }, [user]);
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDT">("ETH");
  const [txHash, setTxHash] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadDepositAddress();
    }
  }, [user]);

  const loadDepositAddress = async () => {
    try {
      const data = await apiClient.getDepositAddress();
      setDepositAddress(data.address);
    } catch (error) {
      console.error("Error loading deposit address:", error);
      // Show user-friendly error
      setDepositAddress("Error loading address. Please ensure you are connected.");
    }
  };

  const handleCheckDeposit = async () => {
    if (!txHash || !selectedCurrency) {
      alert("Please enter transaction hash and select currency");
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.checkDeposit(txHash, selectedCurrency);
      alert(`Deposit ${result.status === "completed" ? "confirmed" : result.status}`);
      if (result.status === "completed" && result.newBalance !== undefined) {
        setTxHash("");
        // Refresh balance from result
        if (selectedCurrency === "ETH") {
          setBalanceETH(result.newBalance);
        } else {
          setBalanceUSDT(result.newBalance);
        }
        // Also refresh user data
        const balanceData = await apiClient.getBalance();
        setBalanceETH(balanceData.balanceETH);
        setBalanceUSDT(balanceData.balanceUSDT);
      }
    } catch (error: any) {
      alert(error.message || "Error checking deposit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 neon-text">Balance & Top-up</h2>

      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-6"
        >
          <div className="text-sm text-gray-400 mb-2">ETH Balance</div>
          <div className="text-4xl font-bold neon-cyan">{balanceETH.toFixed(6)} ETH</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl p-6"
        >
          <div className="text-sm text-gray-400 mb-2">USDT Balance</div>
          <div className="text-4xl font-bold neon-pink">{balanceUSDT.toFixed(2)} USDT</div>
        </motion.div>
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
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Deposit Address</label>
          <div className="glass rounded-lg p-4 flex items-center justify-between">
            <code className="text-sm font-mono break-all pr-4">{depositAddress || "Loading..."}</code>
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
            Platform fee: 5% on all deposits. Send {selectedCurrency} to this address.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Check Deposit (Transaction Hash)</label>
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
      </div>
    </>
  );
}

