"use client";

import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-pulse-neon" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold text-center mb-12 neon-text neon-cyan">
          Terms of <span className="neon-pink">Service</span>
        </h1>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl p-8 space-y-8"
          >
            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing and using BTCWarfare, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">2. Platform Fees</h2>
              <p className="text-gray-300 mb-4">
                BTCWarfare charges platform fees on the following transactions:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Deposits: 5% platform fee</li>
                <li>Bets: 5% platform fee per bet</li>
                <li>Withdrawals: 5% platform fee</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Fees are automatically deducted and clearly displayed before you confirm any transaction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">3. Battle Rules</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Battles last exactly 60 seconds</li>
                <li>The starting Bitcoin price is locked at the moment the battle begins</li>
                <li>The winner is determined by comparing the price at the end of 60 seconds</li>
                <li>If price goes up: Long player wins</li>
                <li>If price goes down: Short player wins</li>
                <li>If price stays the same: Long player wins by default</li>
                <li>The winner receives 100% of the total stake (2x the stake amount)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">4. Account Management</h2>
              <p className="text-gray-300 mb-4">
                You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Maintaining the security of your wallet</li>
                <li>Ensuring you have sufficient balance for battles (stake + fees)</li>
                <li>Using the correct deposit address for your deposits</li>
                <li>Verifying your deposits using the transaction hash</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">5. Risk Warning</h2>
              <p className="text-gray-300 mb-4">
                BTCWarfare involves financial risk. By using this platform, you acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>You may lose the full amount of your stake</li>
                <li>Cryptocurrency prices are highly volatile</li>
                <li>Past performance does not guarantee future results</li>
                <li>You should only bet what you can afford to lose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">6. Withdrawals</h2>
              <p className="text-gray-300 mb-4">
                Withdrawal requests are processed manually. Please ensure:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>You provide a valid destination address</li>
                <li>You have sufficient balance (amount + 5% fee)</li>
                <li>The withdrawal address matches the currency you're withdrawing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">7. Price Feed</h2>
              <p className="text-gray-300 mb-4">
                BTCWarfare uses real-time Bitcoin price data from CoinGecko and Binance. 
                We are not responsible for any inaccuracies in third-party price feeds.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">8. Platform Availability</h2>
              <p className="text-gray-300 mb-4">
                We strive to maintain platform availability but do not guarantee uninterrupted access. 
                The platform may be temporarily unavailable for maintenance or updates.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">9. Prohibited Activities</h2>
              <p className="text-gray-300 mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Use the platform for any illegal activities</li>
                <li>Attempt to manipulate prices or game outcomes</li>
                <li>Use multiple accounts to gain unfair advantage</li>
                <li>Interfere with the platform's operation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 neon-text">10. Changes to Terms</h2>
              <p className="text-gray-300 mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.
                Your continued use of the platform constitutes acceptance of the modified terms.
              </p>
            </section>

            <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

