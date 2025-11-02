"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-pulse-neon" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold text-center mb-12 neon-text neon-cyan">
          How It <span className="neon-pink">Works</span>
        </h1>

        <div className="max-w-4xl mx-auto space-y-12">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="text-6xl font-bold neon-cyan">1</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 neon-text">Top-up Your Account</h2>
                <p className="text-gray-300 mb-4">
                  Deposit ETH to your account. Send crypto to the platform deposit address shown in your account page.
                </p>
                <p className="text-yellow-400 text-sm mb-2">
                  ⚠️ Platform fee: <strong>5%</strong> on all deposits
                </p>
                <p className="text-gray-400 text-sm">
                  After sending, use the transaction hash to verify your deposit. Your balance will be credited automatically (minus the 5% fee).
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-strong rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="text-6xl font-bold neon-pink">2</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 neon-text">Choose Your Position</h2>
                <p className="text-gray-300 mb-4">
                  Once you have balance, enter the Battle Arena and choose:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="glass rounded-lg p-4 border-2 border-neon-cyan">
                    <h3 className="font-bold neon-cyan mb-2">LONG 📈</h3>
                    <p className="text-sm text-gray-300">
                      Bet that Bitcoin price will go UP
                    </p>
                  </div>
                  <div className="glass rounded-lg p-4 border-2 border-neon-pink">
                    <h3 className="font-bold neon-pink mb-2">SHORT 📉</h3>
                    <p className="text-sm text-gray-300">
                      Bet that Bitcoin price will go DOWN
                    </p>
                  </div>
                </div>
                <p className="text-yellow-400 text-sm">
                  ⚠️ Platform fee: <strong>5%</strong> on each bet
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-strong rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="text-6xl font-bold neon-purple">3</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 neon-text">Get Matched</h2>
                <p className="text-gray-300 mb-4">
                  The system automatically matches you with an opponent who chose the opposite position (Long vs Short).
                  The matching is done on a first-come-first-served (FIFO) basis.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="glass-strong rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="text-6xl font-bold neon-cyan">4</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 neon-text">60 Second Battle</h2>
                <p className="text-gray-300 mb-4">
                  Once matched, the battle begins. The starting Bitcoin price is locked at that moment.
                  You have 60 seconds to wait and see how the price moves.
                </p>
                <p className="text-gray-400 text-sm">
                  The battle is automatically resolved after 60 seconds, but you can manually resolve it once the time is up.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 5 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="glass-strong rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="text-6xl font-bold neon-pink">5</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 neon-text">Winner Takes All</h2>
                <p className="text-gray-300 mb-4">
                  After 60 seconds, the current Bitcoin price is compared to the starting price:
                </p>
                <ul className="space-y-2 mb-4 text-gray-300">
                  <li>• <strong className="neon-cyan">Price went UP</strong>: Long player wins</li>
                  <li>• <strong className="neon-pink">Price went DOWN</strong>: Short player wins</li>
                  <li>• <strong>Price stayed the same</strong>: Long player wins by default</li>
                </ul>
                <p className="text-gray-300 mb-2">
                  The winner receives <strong>100%</strong> of the total stake (2x the stake amount).
                </p>
                <p className="text-gray-400 text-sm">
                  Note: Platform fees (5%) are already deducted when you place your bet, so the winner gets the full stake pool.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Step 6 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="glass-strong rounded-xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="text-6xl font-bold neon-purple">6</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 neon-text">Withdraw Your Winnings</h2>
                <p className="text-gray-300 mb-4">
                  You can withdraw your balance at any time from your Account page. Simply enter the amount and destination address.
                </p>
                <p className="text-yellow-400 text-sm">
                  ⚠️ Platform fee: <strong>5%</strong> on all withdrawals
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-16">
          <Link
            href="/battle"
            className="inline-block px-8 py-4 bg-neon-cyan text-black font-bold rounded-lg glow-cyan hover:bg-opacity-90 transition-all"
          >
            Start Battling
          </Link>
        </div>
      </div>
    </main>
  );
}

