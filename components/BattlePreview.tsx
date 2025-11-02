"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function BattlePreview() {
  const [timeRemaining, setTimeRemaining] = useState(45); // 45 secondes restantes pour l'exemple
  const [longPercentage, setLongPercentage] = useState(70); // Pourcentage dynamique

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

  useEffect(() => {
    // Simuler l'évolution dynamique du pourcentage au fil du temps
    // Le pourcentage varie entre 60% et 80% pour le joueur bleu (gagnant)
    const variationInterval = setInterval(() => {
      setLongPercentage((prev) => {
        // Variation entre 60% et 80%
        const min = 60;
        const max = 80;
        // Variation aléatoire mais avec tendance à augmenter
        const change = (Math.random() - 0.3) * 4; // Légèrement biaisé vers le positif
        const newValue = Math.max(min, Math.min(max, prev + change));
        return Math.round(newValue * 10) / 10; // Arrondir à 1 décimale
      });
    }, 2000); // Change toutes les 2 secondes

    return () => clearInterval(variationInterval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculer le pourcentage short (complément à 100%)
  const shortPercentage = Math.round((100 - longPercentage) * 10) / 10;

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

        {/* Unified Battle Bar */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse"></div>
                <span className="font-bold text-sm neon-cyan">Long</span>
              </div>
              <span className="text-gray-500">VS</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-pink animate-pulse"></div>
                <span className="font-bold text-sm neon-pink">Short</span>
              </div>
            </div>
          </div>

          {/* Single Unified Bar */}
          <div className="relative h-16 bg-gray-900 rounded-full overflow-hidden border-2 border-gray-700">
            {/* Blue side (Left) - You */}
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 flex items-center justify-end pr-4 z-10"
              initial={{ width: "0%" }}
              animate={{ width: `${longPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-neon-cyan opacity-20 blur-sm"></div>
              <motion.span
                key={longPercentage}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold text-white z-20 drop-shadow-lg"
              >
                {longPercentage.toFixed(1)}%
              </motion.span>
              {/* Separator line */}
              <div className="absolute right-0 top-0 h-full w-0.5 bg-white/40 shadow-lg"></div>
            </motion.div>

            {/* Purple side (Right) - Opponent */}
            <motion.div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-purple-600 via-pink-500 to-purple-600 flex items-center justify-start pl-4 z-10"
              initial={{ width: "0%" }}
              animate={{ width: `${shortPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-neon-pink opacity-20 blur-sm"></div>
              <motion.span
                key={shortPercentage}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold text-white z-20 drop-shadow-lg"
              >
                {shortPercentage.toFixed(1)}%
              </motion.span>
            </motion.div>
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
          {longPercentage > 50 && (
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
              className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 animate-glow-pulse"
            >
              <span className="text-xl">🏆</span>
              <span className="text-base font-bold neon-cyan">
                You are winning!
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

