"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-pulse-neon" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-purple opacity-10 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Wallet Connect */}
        <div className="absolute top-6 right-6 z-20">
          <WalletConnect />
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-7xl font-bold mb-6 neon-text neon-cyan">
            BTC<span className="neon-pink">WARFARE</span>
          </h1>
          <p className="text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Battle P2P Crypto - Misez sur la tendance du Bitcoin et affrontez d&apos;autres joueurs
          </p>
          {isConnected ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/battle"
                className="inline-block px-8 py-4 bg-neon-cyan text-black font-bold rounded-lg glow-cyan hover:bg-opacity-90 transition-all"
              >
                COMMENCER UNE BATTLE
              </Link>
            </motion.div>
          ) : (
            <p className="text-gray-400 text-lg">
              Connectez votre wallet pour commencer
            </p>
          )}
        </motion.div>

        {/* Rooms Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-12 neon-text">
            Choisissez votre <span className="neon-cyan">Salle de Battle</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Room 1 - MVP Active */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass-strong rounded-xl p-8 border-2 border-neon-cyan relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-neon-cyan text-black px-3 py-1 rounded-full text-xs font-bold">
                MVP
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold neon-cyan mb-4">0.0015 ETH</div>
                <div className="text-gray-300 mb-6">
                  <div className="text-sm opacity-75">Mise de départ</div>
                  <div className="text-lg mt-2">~3.50$</div>
                </div>
                {isConnected ? (
                  <Link
                    href="/battle"
                    className="block w-full py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    ENTRER
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg cursor-not-allowed"
                  >
                    Connectez votre wallet
                  </button>
                )}
              </div>
            </motion.div>

            {/* Room 2 - Coming Soon */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass rounded-xl p-8 border-2 border-gray-600 relative overflow-hidden opacity-60"
            >
              <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                Bientôt
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 mb-4">0.0030 ETH</div>
                <div className="text-gray-500 mb-6">
                  <div className="text-sm opacity-75">Mise de départ</div>
                  <div className="text-lg mt-2">~7.00$</div>
                </div>
                <button
                  disabled
                  className="block w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg cursor-not-allowed"
                >
                  Bientôt disponible
                </button>
              </div>
            </motion.div>

            {/* Room 3 - Coming Soon */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass rounded-xl p-8 border-2 border-gray-600 relative overflow-hidden opacity-60"
            >
              <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                Bientôt
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 mb-4">0.015 ETH</div>
                <div className="text-gray-500 mb-6">
                  <div className="text-sm opacity-75">Mise de départ</div>
                  <div className="text-lg mt-2">~35.00$</div>
                </div>
                <button
                  disabled
                  className="block w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg cursor-not-allowed"
                >
                  Bientôt disponible
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-20"
        >
          <h2 className="text-4xl font-bold text-center mb-12 neon-text">
            Comment ça <span className="neon-pink">fonctionne</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">1️⃣</div>
              <h3 className="text-xl font-bold neon-cyan mb-3">Choisissez votre camp</h3>
              <p className="text-gray-300">
                Long ou Short sur le Bitcoin
              </p>
            </div>

            <div className="glass rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">2️⃣</div>
              <h3 className="text-xl font-bold neon-pink mb-3">Affrontez un adversaire</h3>
              <p className="text-gray-300">
                Match automatique avec un joueur opposé
              </p>
            </div>

            <div className="glass rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">3️⃣</div>
              <h3 className="text-xl font-bold neon-purple mb-3">Remportez la mise</h3>
              <p className="text-gray-300">
                60 secondes plus tard, le gagnant empoche 95% de la mise
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

