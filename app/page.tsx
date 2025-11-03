"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { BitcoinChart } from "@/components/BitcoinChart";
import { BattlePreview } from "@/components/BattlePreview";

export default function Home() {
  const { isConnected } = useWallet();

  useEffect(() => {
    console.log("isConnected", isConnected);
  }, [isConnected]);

  const currencySymbol = "ETH"; // ETH or USDT depending on user choice

  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-blur-pulse" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-blur-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-purple opacity-10 rounded-full blur-3xl animate-blur-pulse"
          style={{ animationDelay: "2s" }}
        />
        {/* Additional floating particles */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-neon-cyan opacity-5 rounded-full blur-2xl animate-float" />
        <div
          className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-neon-pink opacity-5 rounded-full blur-2xl animate-drift"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-3/4 right-1/2 w-48 h-48 bg-neon-purple opacity-5 rounded-full blur-2xl animate-particle"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-7xl font-bold mb-6 neon-text neon-cyan"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            BTC<span className="neon-pink">WARFARE</span>
          </motion.h1>
          <p className="text-2xl text-gray-300 mb-4 max-w-2xl mx-auto flex items-center justify-center gap-2">
            <span>⚔️</span> Battle P2P Crypto - Bet on Bitcoin trend and crush
            your enemies
            <span>💥</span>
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the arena where legends are made. Every second counts.
          </p>
          {isConnected ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Link
                href="/battle"
                className="inline-flex items-center gap-2 px-8 py-4 bg-neon-cyan text-black font-bold rounded-lg glow-cyan hover:bg-opacity-90 transition-all animate-glow-pulse"
              >
                <span>🚀</span> START A BATTLE <span>🔥</span>
              </Link>
            </motion.div>
          ) : (
            <p className="text-gray-400 text-lg">
              Connect your wallet to get started <span>⚡</span>
            </p>
          )}
        </motion.div>

        {/* Bitcoin Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-6xl mx-auto mb-16"
        >
          <BitcoinChart />
        </motion.div>

        {/* Battle Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-20"
        >
          <BattlePreview />
        </motion.div>

        {/* Rooms Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-4 neon-text">
            Choose your <span className="neon-cyan">Battle Room</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 flex items-center justify-center gap-2">
            <span>🎯</span> Select your stake and enter the arena{" "}
            <span>⚡</span>
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Room 1 - MVP Active */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10, rotate: 1 }}
              className="glass-strong rounded-xl p-8 border-2 border-neon-cyan relative overflow-hidden glass-animated"
            >
              <div className="absolute top-4 right-4 bg-neon-cyan text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span>⭐</span> MVP
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold neon-cyan mb-4">
                  0.0015 {currencySymbol}
                </div>
                <div className="text-gray-300 mb-6">
                  <div className="text-sm opacity-75">Starting stake</div>
                  <div className="text-lg mt-2">~$3.50</div>
                </div>
                {isConnected ? (
                  <Link
                    href="/battle"
                    className="block w-full py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    ENTER
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg cursor-not-allowed"
                  >
                    Connect your wallet
                  </button>
                )}
              </div>
            </motion.div>

            {/* Room 2 - Coming Soon */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass rounded-xl p-8 border-2 border-gray-600 relative overflow-hidden opacity-60"
            >
              <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span>🔒</span> Soon
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 mb-4">
                  0.0030 {currencySymbol}
                </div>
                <div className="text-gray-500 mb-6">
                  <div className="text-sm opacity-75">Starting stake</div>
                  <div className="text-lg mt-2">~$7.00</div>
                </div>
                <button
                  disabled
                  className="block w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg cursor-not-allowed"
                >
                  Coming soon
                </button>
              </div>
            </motion.div>

            {/* Room 3 - Coming Soon */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="glass rounded-xl p-8 border-2 border-gray-600 relative overflow-hidden opacity-60"
            >
              <div className="absolute top-4 right-4 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <span>🔒</span> Soon
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400 mb-4">
                  0.015 {currencySymbol}
                </div>
                <div className="text-gray-500 mb-6">
                  <div className="text-sm opacity-75">Starting stake</div>
                  <div className="text-lg mt-2">~$35.00</div>
                </div>
                <button
                  disabled
                  className="block w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-lg cursor-not-allowed"
                >
                  Coming soon
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Competitive Section: Dominate the Arena */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-20 mb-20"
        >
          <div className="glass-strong rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer opacity-20"></div>
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <h2 className="text-5xl font-bold mb-4 neon-text">
                  <span className="neon-cyan">💪</span> Dominate the Arena{" "}
                  <span className="neon-pink">🔥</span>
                </h2>
                <p className="text-2xl text-gray-300 mb-6">
                  Crush every opponent. Build your legacy.
                  <span className="text-3xl ml-2">⚡</span>
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="glass rounded-xl p-6"
                  >
                    <div className="text-4xl mb-3">🏆</div>
                    <div className="text-2xl font-bold neon-cyan mb-2">
                      10K+
                    </div>
                    <div className="text-sm text-gray-400">Battles Fought</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="glass rounded-xl p-6"
                  >
                    <div className="text-4xl mb-3">⭐</div>
                    <div className="text-2xl font-bold neon-pink mb-2">5K+</div>
                    <div className="text-sm text-gray-400">Active Warriors</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="glass rounded-xl p-6"
                  >
                    <div className="text-4xl mb-3">💰</div>
                    <div className="text-2xl font-bold neon-purple mb-2">
                      1M+
                    </div>
                    <div className="text-sm text-gray-400">ETH Won</div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-4xl mx-auto mt-20"
        >
          <h2 className="text-4xl font-bold text-center mb-4 neon-text">
            How it <span className="neon-pink">works</span>?{" "}
            <span className="text-3xl">🤔</span>
          </h2>
          <p className="text-center text-gray-400 mb-12">
            Simple rules. Maximum intensity.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass rounded-xl p-6 text-center glass-animated"
            >
              <div className="text-5xl mb-4">1️⃣</div>
              <h3 className="text-xl font-bold neon-cyan mb-3">
                Choose your side
              </h3>
              <p className="text-gray-300">
                Long <span>📈</span> or Short <span>📉</span> on Bitcoin
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass rounded-xl p-6 text-center glass-animated"
            >
              <div className="text-5xl mb-4">2️⃣</div>
              <h3 className="text-xl font-bold neon-pink mb-3">
                Face an opponent
              </h3>
              <p className="text-gray-300">
                <span>⚔️</span> Automatic match with an opposite player
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass rounded-xl p-6 text-center glass-animated"
            >
              <div className="text-5xl mb-4">3️⃣</div>
              <h3 className="text-xl font-bold neon-purple mb-3">
                Win the stake
              </h3>
              <p className="text-gray-300">
                <span>⏱️</span> 60 seconds later, the winner takes 100% of the
                stake <span>💎</span>
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Join the Fight CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-4xl mx-auto mt-20 mb-20"
        >
          <div className="glass-strong rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 via-neon-pink/10 to-neon-purple/10 animate-pulse"></div>
            <div className="relative z-10">
              <motion.h2
                className="text-4xl font-bold mb-4 neon-text"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Ready to <span className="neon-cyan">Conquer</span>?{" "}
                <span className="text-4xl">🚀</span>
              </motion.h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of warriors competing for glory{" "}
                <span className="text-2xl">⚔️</span>
              </p>
              {isConnected ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/battle"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-neon-cyan to-neon-pink text-black font-bold rounded-lg glow-cyan hover:bg-opacity-90 transition-all text-lg"
                  >
                    <span className="text-2xl">🔥</span>
                    ENTER THE ARENA NOW
                    <span className="text-2xl">⚡</span>
                  </Link>
                </motion.div>
              ) : (
                <motion.p
                  className="text-gray-400 text-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Connect your wallet to begin your journey{" "}
                  <span className="text-xl">💼</span>
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
