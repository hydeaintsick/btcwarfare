"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { apiClient } from "@/lib/api";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, isConnecting, user } = useWallet();
  const [balanceETH, setBalanceETH] = useState<number>(0);
  const [balanceUSDT, setBalanceUSDT] = useState<number>(0);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Marquer qu'on a vérifié l'auth une fois que le check est terminé
  useEffect(() => {
    if (!isConnecting) {
      setHasCheckedAuth(true);
    }
  }, [isConnecting]);

  useEffect(() => {
    const refreshBalance = async () => {
      if (isConnected && user) {
        try {
          const balance = await apiClient.getBalance();
          setBalanceETH(balance.balanceETH);
          setBalanceUSDT(balance.balanceUSDT);
        } catch {
          setBalanceETH(user.balanceETH || 0);
          setBalanceUSDT(user.balanceUSDT || 0);
        }
      }
    };

    refreshBalance();
    const interval = setInterval(refreshBalance, 5000);
    return () => clearInterval(interval);
  }, [isConnected, user]);

  // Redirect to balance if at /account
  useEffect(() => {
    if (pathname === "/account") {
      router.replace("/account/balance");
    }
  }, [pathname, router]);

  // Afficher un loader pendant la vérification de l'auth
  if (isConnecting || (!hasCheckedAuth && !isConnected)) {
    return (
      <main className="min-h-screen animated-gradient">
        <div className="container mx-auto px-4 py-16">
          <div className="glass-strong rounded-xl p-8 max-w-2xl mx-auto text-center">
            <p className="text-xl text-gray-300 mb-4">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  // Afficher le message de connexion uniquement si on a vérifié et qu'on n'est pas connecté
  if (!isConnected && hasCheckedAuth) {
    return (
      <main className="min-h-screen animated-gradient">
        <div className="container mx-auto px-4 py-16">
          <div className="glass-strong rounded-xl p-8 max-w-2xl mx-auto text-center">
            <p className="text-xl text-gray-300 mb-4">
              Please connect your wallet to view your account
            </p>
          </div>
        </div>
      </main>
    );
  }

  const menuItems = [
    { path: "/account/balance", label: "Balance & Top-up", icon: "💰" },
    { path: "/account/withdraw", label: "Withdraw", icon: "💸" },
    { path: "/account/battles", label: "Battle History", icon: "⚔️" },
    { path: "/account/transactions", label: "Transactions", icon: "📋" },
  ];

  return (
    <main className="min-h-screen animated-gradient">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold text-center mb-12 neon-text neon-cyan">
          Account <span className="neon-pink">Management</span>
        </h1>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Menu */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-strong rounded-xl p-4 space-y-2 sticky top-24"
              >
                {/* Balance Summary */}
                <div className="pb-4 mb-4 border-b border-white/10">
                  <div className="text-xs text-gray-400 mb-2">ETH Balance</div>
                  <div className="text-lg font-bold neon-cyan">
                    {balanceETH.toFixed(6)} ETH
                  </div>
                  {/* <div className="text-xs text-gray-400 mt-2 mb-2">USDT Balance</div>
                  <div className="text-lg font-bold neon-pink">{balanceUSDT.toFixed(2)} USDT</div> */}
                </div>

                {/* Menu Items */}
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`block px-4 py-3 rounded-lg transition-all mb-2 ${
                      pathname === item.path
                        ? "bg-neon-cyan text-black font-medium"
                        : "text-gray-300 hover:bg-white/10 hover:text-neon-cyan"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-xl p-8 min-h-[500px]"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
