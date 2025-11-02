"use client";

import { motion } from "framer-motion";

export default function SupportPage() {
  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-pulse-neon" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold text-center mb-12 neon-text neon-cyan">
          Support
        </h1>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 neon-text">Need Help?</h2>
            <p className="text-gray-300 mb-6">
              We're here to help! If you have any questions or issues, please contact us through the channels below.
            </p>

            <div className="space-y-6">
              <div className="glass rounded-lg p-6">
                <h3 className="text-xl font-bold neon-cyan mb-3">Email Support</h3>
                <p className="text-gray-300 mb-2">
                  For account issues, transaction problems, or general inquiries:
                </p>
                <a
                  href="mailto:support@btcwarfare.com"
                  className="text-neon-cyan hover:underline"
                >
                  support@btcwarfare.com
                </a>
              </div>

              <div className="glass rounded-lg p-6">
                <h3 className="text-xl font-bold neon-pink mb-3">Common Issues</h3>
                <div className="space-y-4 text-gray-300">
                  <div>
                    <h4 className="font-bold text-white mb-1">Deposit not showing?</h4>
                    <p className="text-sm">
                      Make sure you sent the crypto to the correct deposit address shown in your Account page. 
                      Use the "Check Deposit" feature with your transaction hash to verify.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Can't enter a battle?</h4>
                    <p className="text-sm">
                      Check that you have enough balance (stake amount + 5% fee). You need at least 0.001575 ETH 
                      to enter the MVP room (stake of 0.0015 + 5% fee).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Battle not resolving?</h4>
                    <p className="text-sm">
                      Battles are automatically resolved after 60 seconds. If it's been longer, try manually 
                      clicking the "Resolve Battle" button.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-lg p-6">
                <h3 className="text-xl font-bold neon-purple mb-3">Platform Fees</h3>
                <div className="space-y-2 text-gray-300">
                  <p>• <strong>Deposits:</strong> 5% platform fee</p>
                  <p>• <strong>Bets:</strong> 5% platform fee per bet</p>
                  <p>• <strong>Withdrawals:</strong> 5% platform fee</p>
                  <p className="text-sm text-gray-400 mt-4">
                    All fees are automatically deducted and clearly displayed before you confirm any transaction.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

