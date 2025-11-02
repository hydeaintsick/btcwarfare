"use client";

import { formatAddress } from "@/lib/utils";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";

export function WalletConnect() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-lg px-6 py-3 flex items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-gray-200">
            {formatAddress(address)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium border border-red-500/30"
        >
          Disconnect
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <button
        onClick={() => connect()}
        disabled={isConnecting}
        className="px-6 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </motion.div>
  );
}
