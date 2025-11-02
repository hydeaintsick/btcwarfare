"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useWallet } from "@/hooks/useWallet";
import Link from "next/link";

const TOPUP_PACKS = [
  { amount: 0.05, label: "0.05 ETH", bestseller: false },
  { amount: 0.1, label: "0.1 ETH", bestseller: false },
  { amount: 0.2, label: "0.2 ETH", bestseller: true },
  { amount: 0.5, label: "0.5 ETH", bestseller: false },
  { amount: 1, label: "1 ETH", bestseller: false },
];

const COMMISSION_RATE = 0.05; // 5%

export default function TopupPage() {
  const router = useRouter();
  const { isConnected, isConnecting, sendTransaction, address, user } = useWallet();
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "confirmed" | "failed">("idle");
  const [error, setError] = useState<string>("");

  // Attendre que la vérification de l'auth soit terminée avant de rediriger
  useEffect(() => {
    // Ne pas rediriger si on est encore en train de vérifier l'auth
    // Attendre que isConnecting soit false (vérification terminée) avant de vérifier isConnected
    if (!isConnecting) {
      if (!isConnected) {
        router.push("/account/balance");
      }
    }
  }, [isConnected, isConnecting, router]);

  useEffect(() => {
    // Charger l'adresse de dépôt si un pack est sélectionné
    if (selectedPack !== null) {
      loadDepositAddress();
    }
  }, [selectedPack]);

  useEffect(() => {
    // Si on a un txHash, commencer le polling
    if (txHash && txStatus === "pending") {
      const interval = setInterval(() => {
        checkTransactionStatus();
      }, 3000); // Polling toutes les 3 secondes

      return () => clearInterval(interval);
    }
  }, [txHash, txStatus]);

  const loadDepositAddress = async () => {
    try {
      const data = await apiClient.getDepositAddress();
      setDepositAddress(data.address);
    } catch (error: any) {
      setError(error.message || "Error loading deposit address");
    }
  };

  const checkTransactionStatus = async () => {
    if (!txHash || !selectedPack) return;

    try {
      const result = await apiClient.watchTopupTransaction(txHash, "ETH");
      
      if (result.status === "confirmed") {
        setTxStatus("confirmed");
        // Rediriger vers la page de succès après 2 secondes
        setTimeout(() => {
          router.push(`/account/topup/success?amount=${selectedPack}&txHash=${txHash}&credited=${result.amountAfterFee}`);
        }, 2000);
      } else if (result.status === "failed") {
        setTxStatus("failed");
        setError("Transaction failed");
      }
      // Si pending, on continue le polling
    } catch (error: any) {
      console.error("Error checking transaction:", error);
      // Ne pas arrêter le polling en cas d'erreur temporaire
    }
  };

  const handlePackSelect = (amount: number) => {
    setSelectedPack(amount);
    setError("");
    setTxHash("");
    setTxStatus("idle");
  };

  const handlePay = async () => {
    if (!selectedPack || !depositAddress) {
      setError("Please select a pack first");
      return;
    }

    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Initier le topup côté backend
      await apiClient.initiateTopup(selectedPack, "ETH");

      // Envoyer la transaction via MetaMask
      const result = await sendTransaction(depositAddress, selectedPack, "ETH");
      
      setTxHash(result.hash);
      setTxStatus("pending");
      
      // Commencer le polling immédiatement
      checkTransactionStatus();
    } catch (err: any) {
      setError(err.message || "Failed to send transaction");
      setTxStatus("failed");
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedAmount = selectedPack || 0;
  const fee = selectedAmount * COMMISSION_RATE;
  const amountAfterFee = selectedAmount * (1 - COMMISSION_RATE);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold neon-text">Top-up Your Account</h2>
        <Link
          href="/account/balance"
          className="text-gray-400 hover:text-neon-cyan transition-colors"
        >
          ← Back to Balance
        </Link>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Pack Selection */}
        <div>
          <h3 className="text-xl font-bold mb-4 neon-text">Select a Pack</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {TOPUP_PACKS.map((pack) => (
              <motion.button
                key={pack.amount}
                onClick={() => handlePackSelect(pack.amount)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`glass rounded-xl p-6 text-center transition-all ${
                  selectedPack === pack.amount
                    ? "border-2 border-neon-cyan bg-neon-cyan/20"
                    : "border-2 border-transparent hover:border-gray-600"
                }`}
              >
                {pack.bestseller && (
                  <div className="absolute -top-2 -right-2 bg-neon-pink text-black text-xs font-bold px-2 py-1 rounded-full">
                    Best seller
                  </div>
                )}
                <div className="text-2xl font-bold neon-cyan mb-2">
                  {pack.label}
                </div>
                {pack.bestseller && (
                  <div className="text-xs text-neon-pink mt-1">⭐ Popular</div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Transaction Details */}
        {selectedPack !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-6 space-y-4"
          >
            <h3 className="text-xl font-bold neon-text">Transaction Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount to send:</span>
                <span className="text-lg font-bold neon-cyan">
                  {selectedAmount.toFixed(6)} ETH
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Platform fee (5%):</span>
                <span className="text-lg font-bold text-yellow-400">
                  -{fee.toFixed(6)} ETH
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">You will receive:</span>
                  <span className="text-2xl font-bold neon-pink">
                    {amountAfterFee.toFixed(6)} ETH
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {txStatus === "pending" && txHash && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-yellow-400 font-medium">
                    Transaction pending...
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono break-all mt-2">
                  {txHash}
                </div>
                <p className="text-sm text-gray-300 mt-2">
                  Waiting for blockchain confirmation. This may take a few minutes.
                </p>
              </div>
            )}

            {txStatus === "confirmed" && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-green-400 font-bold">✓ Transaction confirmed!</span>
                </div>
                <p className="text-sm text-gray-300">
                  Redirecting to success page...
                </p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={loading || txStatus === "pending" || txStatus === "confirmed"}
              className="w-full py-4 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading
                ? "Processing..."
                : txStatus === "pending"
                ? "Waiting for confirmation..."
                : txStatus === "confirmed"
                ? "Confirmed!"
                : "Pay with MetaMask"}
            </button>
          </motion.div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>How it works:</strong> Select a pack, confirm the payment in MetaMask, 
            and wait for blockchain confirmation. Your account will be automatically credited 
            (amount - 5% platform fee) once the transaction is confirmed.
          </p>
        </div>
      </div>
    </>
  );
}

