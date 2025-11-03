"use client";

import { motion } from "framer-motion";

interface BattleBettingProps {
  onEnterBattle: (isLong: boolean) => void;
  isPending: boolean;
  selectedPosition: "long" | "short" | null;
  battle: any | null;
  isConnected: boolean;
}

const STAKE_AMOUNT = 0.0015; // ETH

export function BattleBetting({
  onEnterBattle,
  isPending,
  selectedPosition,
  battle,
  isConnected,
}: BattleBettingProps) {
  if (battle) {
    return null; // Ne pas afficher si une battle est active
  }

  // Debug: vérifier que isConnected change
  console.log("BattleBetting render - isConnected:", isConnected);

  const isLongDisabled = isPending || selectedPosition === "long";
  const isShortDisabled = isPending || selectedPosition === "short";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl p-6 border-2 border-neon-cyan relative overflow-hidden h-full flex flex-col"
      style={{
        boxShadow: "0 0 15px rgba(0, 255, 255, 0.3), inset 0 0 15px rgba(0, 255, 255, 0.1)",
      }}
    >
      {/* Effet de pulsation en arrière-plan */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-pink-500/10"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-lg font-bold neon-text text-center mb-4">
          Enter the <span className="neon-cyan">Battle</span>
        </h3>

        {/* Stake Selection */}
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2 text-center">Stake Amount</div>
          <div className="flex gap-2 justify-center">
            {/* ETH - Actif */}
            <button
              className="px-4 py-2 rounded-lg font-medium transition-all bg-neon-cyan text-black cursor-default"
              disabled
            >
              {STAKE_AMOUNT} ETH
            </button>
            {/* USDT - Coming soon */}
            <button
              className="px-4 py-2 rounded-lg font-medium transition-all bg-gray-700 text-gray-500 cursor-not-allowed opacity-50 relative"
              disabled
              title="Coming soon"
            >
              USDT
              <span className="absolute -top-1 -right-1 text-[8px] text-gray-400">Soon</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-4 flex-grow items-end">
          {/* Bouton LONG */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("LONG button clicked - isConnected:", isConnected, "isLongDisabled:", isLongDisabled);
              onEnterBattle(true);
            }}
            disabled={isLongDisabled}
            className={`flex-1 py-3 px-4 bg-neon-cyan text-black font-bold rounded-lg transition-all relative overflow-hidden ${
              isLongDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-opacity-90 cursor-pointer active:scale-95"
            }`}
            whileHover={!isLongDisabled ? { scale: 1.03 } : {}}
            whileTap={!isLongDisabled ? { scale: 0.97 } : {}}
          >
            {isPending && selectedPosition === "long" ? "Waiting..." : "LONG"}
          </motion.button>

          {/* Bouton SHORT */}
          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("SHORT button clicked - isConnected:", isConnected, "isShortDisabled:", isShortDisabled);
              onEnterBattle(false);
            }}
            disabled={isShortDisabled}
            className={`flex-1 py-3 px-4 bg-neon-pink text-black font-bold rounded-lg transition-all relative overflow-hidden ${
              isShortDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-opacity-90 cursor-pointer active:scale-95"
            }`}
            whileHover={!isShortDisabled ? { scale: 1.03 } : {}}
            whileTap={!isShortDisabled ? { scale: 0.97 } : {}}
          >
            {isPending && selectedPosition === "short" ? "Waiting..." : "SHORT"}
          </motion.button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-auto">
          5% service fees will be applied
        </p>
      </div>
    </motion.div>
  );
}

