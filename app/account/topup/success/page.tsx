"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";

export default function TopupSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useWallet();
  const [balance, setBalance] = useState<{ balanceETH: number; balanceUSDT: number } | null>(null);

  const amount = parseFloat(searchParams.get("amount") || "0");
  const txHash = searchParams.get("txHash") || "";
  const credited = parseFloat(searchParams.get("credited") || "0");

  useEffect(() => {
    // Rafraîchir le solde
    const refreshBalance = async () => {
      try {
        const balanceData = await apiClient.getBalance();
        setBalance(balanceData);
      } catch (error) {
        console.error("Error loading balance:", error);
      }
    };

    refreshBalance();
  }, []);

  if (!amount || !txHash) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6 neon-text">Invalid Success Page</h2>
        <Link
          href="/account/balance"
          className="inline-block px-6 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90"
        >
          Return to Balance
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500"
        >
          <span className="text-5xl">✓</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold neon-text mb-4">
            Top-up Successful!
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Your account has been credited successfully
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-8 max-w-2xl mx-auto space-y-6"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Amount sent:</span>
              <span className="text-lg font-bold neon-cyan">
                {amount.toFixed(6)} ETH
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Platform fee (5%):</span>
              <span className="text-lg font-bold text-yellow-400">
                -{(amount * 0.05).toFixed(6)} ETH
              </span>
            </div>

            <div className="flex justify-between items-center py-4 bg-neon-cyan/10 rounded-lg px-4">
              <span className="text-xl font-medium neon-cyan">Amount credited:</span>
              <span className="text-2xl font-bold neon-pink">
                {credited > 0 ? credited.toFixed(6) : (amount * 0.95).toFixed(6)} ETH
              </span>
            </div>
          </div>

          {txHash && (
            <div className="pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Transaction Hash:</div>
              <code className="text-xs font-mono break-all text-gray-300 bg-gray-900 p-3 rounded-lg block">
                {txHash}
              </code>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neon-cyan hover:underline mt-2 inline-block"
              >
                View on Etherscan →
              </a>
            </div>
          )}

          {balance && (
            <div className="pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-2">Current Balance:</div>
              <div className="text-2xl font-bold neon-cyan">
                {balance.balanceETH.toFixed(6)} ETH
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <Link
            href="/account/balance"
            className="px-8 py-4 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all"
          >
            View Balance
          </Link>
          <Link
            href="/battle"
            className="px-8 py-4 bg-neon-pink text-black font-bold rounded-lg hover:bg-opacity-90 transition-all"
          >
            Start a Battle
          </Link>
        </motion.div>
      </div>
    </>
  );
}

