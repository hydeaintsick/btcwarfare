"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function BattlePreview() {
  const [timeRemaining, setTimeRemaining] = useState(45); // 45 secondes restantes pour l'exemple

  useEffect(() => {
    // Animation du countdown (décrémente lentement pour la démo)
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) return 60;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Mockup data - Long player winning (70%)
  const longPercentage = 70;
  const shortPercentage = 30;
  const longPower = longPercentage;
  const shortPower = shortPercentage;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-strong rounded-xl p-8 backdrop-blur-xl relative overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-neon-cyan opacity-5 blur-3xl" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-neon-pink opacity-5 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold neon-text flex items-center gap-2">
            <span>⚔️</span> Live Battle Preview
          </h3>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Time Remaining</div>
            <motion.div
              key={timeRemaining}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-3xl font-bold neon-cyan"
            >
              {formatTime(timeRemaining)}
            </motion.div>
          </div>
        </div>

        {/* Players */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Long Player (Blue) */}
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse"></div>
                <span className="font-bold text-sm">Long Player</span>
              </div>
              <span className="text-xs text-gray-400">📈</span>
            </div>
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1">Power</div>
              <div className="text-2xl font-bold neon-cyan">{longPower}%</div>
            </div>
            {/* Jauge Long */}
            <div className="relative h-8 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${longPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-neon-cyan opacity-30 blur-sm"></div>
                <div className="absolute right-0 top-0 h-full w-1 bg-white opacity-50"></div>
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white z-10">
                  {longPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Short Player (Purple) */}
          <div className="glass rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-pink animate-pulse"></div>
                <span className="font-bold text-sm">Short Player</span>
              </div>
              <span className="text-xs text-gray-400">📉</span>
            </div>
            <div className="mb-2">
              <div className="text-xs text-gray-400 mb-1">Power</div>
              <div className="text-2xl font-bold neon-pink">{shortPower}%</div>
            </div>
            {/* Jauge Short */}
            <div className="relative h-8 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${shortPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-neon-pink opacity-30 blur-sm"></div>
                <div className="absolute right-0 top-0 h-full w-1 bg-white opacity-50"></div>
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-start pl-2">
                <span className="text-xs font-bold text-white z-10">
                  {shortPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="glass rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Stake</div>
            <div className="text-sm font-bold neon-cyan">0.0015 ETH</div>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Start Price</div>
            <div className="text-sm font-bold">$65,432</div>
          </div>
          <div className="glass rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">Current</div>
            <div className="text-sm font-bold text-green-400">$65,890</div>
          </div>
        </div>

        {/* Winner indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2">
            <span className="text-lg">🏆</span>
            <span className="text-sm font-bold neon-cyan">
              Long is winning!
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

