"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Countdown } from "@/components/Countdown";
import { BattleChart } from "@/components/BattleChart";
import { OrderBook } from "@/components/OrderBook";
import { BattleBetting } from "@/components/BattleBetting";
import { useWallet } from "@/hooks/useWallet";
import {
  useCurrentBTCPrice,
  useCurrentBattle,
  useBattleHistory,
  useBattleActions,
  BATTLE_DURATION,
} from "@/hooks/useAPI";

export default function BattlePage() {
  const { isConnected, address } = useWallet();
  const [selectedPosition, setSelectedPosition] = useState<"long" | "short" | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDT">("ETH");

  const { priceUSD: currentBTCPrice } = useCurrentBTCPrice();
  const { battle } = useCurrentBattle();
  const { battles: battleHistory } = useBattleHistory();
  const { enterBattle, resolveBattle, isPending } = useBattleActions();

  // Stats mockées
  const [longPercentage, setLongPercentage] = useState<number>(50);
  const [shortPercentage, setShortPercentage] = useState<number>(50);
  const [amountPlayed, setAmountPlayed] = useState<number | null>(null);

  // Référence pour garder la valeur précédente du montant
  const previousAmountRef = useRef<number | null>(null);

  // Calculer les joueurs en ligne à partir du montant joué (division par 0.0015)
  // Formater avec séparateur de milliers
  const playersOnline = amountPlayed !== null ? Math.floor(amountPlayed / 0.0015) : 0;
  const formattedPlayers = playersOnline > 0 ? playersOnline.toLocaleString("en-US") : "0";

  // Générer des pourcentages long/short (la somme doit faire 100%)
  const generateDominance = () => {
    const long = Math.floor(Math.random() * 40) + 30; // Entre 30% et 70%
    const short = 100 - long;
    return { long, short };
  };

  // Générer un montant ETH avec variation limitée à ±2% et limite minimale de 3 ETH
  const generateAmountPlayed = (previousAmount: number | null): number => {
    const min = 3.0;
    const max = 6.0;
    
    // Si c'est la première génération ou pas de valeur précédente, générer une valeur initiale
    if (previousAmount === null || previousAmount === 0) {
      const decimals = Math.random() > 0.5 ? 2 : 3;
      const amount = min + Math.random() * (max - min);
      let rounded = Math.floor(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
      
      if (Math.abs(rounded % 1) < 0.0001) {
        rounded = rounded + (Math.random() * 0.1 + 0.001);
      }
      
      const str = rounded.toFixed(3);
      if (str.endsWith('00')) {
        rounded = rounded + 0.001;
      }
      
      return Math.min(Math.max(rounded, min), max);
    }

    // Calculer la variation maximale (±2%)
    const maxVariation = previousAmount * 0.02;
    
    // Calculer le montant minimum après une variation négative de 2%
    const minAfterVariation = previousAmount - maxVariation;
    
    // Si une variation négative de 2% nous ferait descendre en dessous de 3 ETH, on doit remonter
    const isAtMinimum = minAfterVariation <= min || previousAmount <= min + 0.01;
    
    // Générer une variation entre -2% et +2%, mais si à la limite minimale, uniquement positif
    let variation: number;
    if (isAtMinimum) {
      // Obligatoirement positif (remonter)
      variation = Math.random() * maxVariation; // Entre 0 et +2%
    } else {
      // Variation normale entre -2% et +2%
      variation = (Math.random() * 2 - 1) * maxVariation; // Entre -2% et +2%
    }
    
    let newAmount = previousAmount + variation;
    
    // S'assurer qu'on reste dans les limites [3, 6] - garantir qu'on ne descend jamais en dessous de 3
    newAmount = Math.max(min, Math.min(newAmount, max));
    
    // Arrondir à 3 décimales et s'assurer que ce n'est pas un chiffre rond
    let rounded = Math.floor(newAmount * 1000) / 1000;
    
    // S'assurer que ce n'est pas un chiffre rond
    if (Math.abs(rounded % 1) < 0.0001) {
      rounded = rounded + 0.001;
    }
    
    const str = rounded.toFixed(3);
    if (str.endsWith('00')) {
      rounded = rounded + 0.001;
    }
    
    return Math.min(Math.max(rounded, min), max);
  };

  // Mettre à jour la dominance toutes les 5 secondes
  useEffect(() => {
    const updateDominance = () => {
      const { long, short } = generateDominance();
      setLongPercentage(long);
      setShortPercentage(short);
    };
    updateDominance();
    const interval = setInterval(updateDominance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour le montant joué toutes les 3 secondes avec variation limitée
  useEffect(() => {
    // Initialiser avec une première valeur
    const initialAmount = generateAmountPlayed(null);
    setAmountPlayed(initialAmount);
    previousAmountRef.current = initialAmount;
    
    const interval = setInterval(() => {
      setAmountPlayed((prev) => {
        const newAmount = generateAmountPlayed(previousAmountRef.current);
        previousAmountRef.current = newAmount;
        return newAmount;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterRoom = async (isLong: boolean) => {
    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }

    try {
      setSelectedPosition(isLong ? "long" : "short");
      await enterBattle(isLong ? "long" : "short", selectedCurrency);
      setSelectedPosition(null);
    } catch (error: any) {
      console.error("Error entering room:", error);
      alert(error?.message || "Error entering the room");
      setSelectedPosition(null);
    }
  };

  const handleResolveBattle = async (battleId: string) => {
    try {
      await resolveBattle(battleId);
    } catch (error: any) {
      console.error("Error resolving battle:", error);
      alert(error?.message || "Error resolving the battle");
    }
  };

  // Check if battle can be resolved (60 seconds elapsed)
  const canResolve = battle
    ? new Date(battle.startTime).getTime() + BATTLE_DURATION * 1000 <= Date.now()
    : false;

  return (
    <main className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-neon-cyan opacity-10 rounded-full blur-3xl animate-pulse-neon" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-pink opacity-10 rounded-full blur-3xl animate-pulse-neon" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <h1 className="text-6xl font-bold text-center mb-8 neon-text neon-cyan">
          BATTLE <span className="neon-pink">ARENA</span>
        </h1>

        {!isConnected ? (
          <div className="glass-strong rounded-xl p-8 max-w-2xl mx-auto text-center">
            <p className="text-xl text-gray-300 mb-4">
              Connect your wallet to start a battle
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {/* Players Online */}
                <div className="glass rounded-lg px-6 py-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Players Online</div>
                  <div className="text-3xl font-bold neon-cyan relative overflow-hidden h-12 flex items-center justify-center">
                    {amountPlayed !== null ? (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={playersOnline}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="absolute"
                        >
                          {formattedPlayers}
                        </motion.span>
                      </AnimatePresence>
                    ) : (
                      <span className="absolute">0</span>
                    )}
                  </div>
                </div>

                {/* Long/Short Dominance */}
                <div className="glass rounded-lg px-6 py-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Market Sentiment</div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold neon-cyan relative overflow-hidden min-w-[3rem] h-7 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={longPercentage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute"
                          >
                            {longPercentage}%
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <div className="text-xs text-gray-400">LONG</div>
                    </div>
                    <div className="w-px h-8 bg-gray-600"></div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold neon-pink relative overflow-hidden min-w-[3rem] h-7 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={shortPercentage}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="absolute"
                          >
                            {shortPercentage}%
                          </motion.span>
                        </AnimatePresence>
                      </div>
                      <div className="text-xs text-gray-400">SHORT</div>
                    </div>
                  </div>
                </div>

                {/* Amount Currently Played */}
                <div className="glass rounded-lg px-6 py-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Amount Currently Played</div>
                  <div className="text-3xl font-bold neon-cyan relative overflow-hidden h-12 flex items-center justify-center">
                    {amountPlayed !== null ? (
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={amountPlayed.toFixed(3)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="absolute"
                        >
                          {amountPlayed.toFixed(3)} ETH
                        </motion.span>
                      </AnimatePresence>
                    ) : (
                      <span className="absolute">0.000 ETH</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Battle */}
            {battle && battle.status === "active" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto mb-8"
              >
                <div className="glass-strong rounded-xl p-8">
                  <h2 className="text-2xl font-bold mb-6 neon-text">Active Battle</h2>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="glass rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Long Player</div>
                      <div className="font-bold neon-cyan">{battle.longPlayer.address}</div>
                    </div>
                    <div className="glass rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">Short Player</div>
                      <div className="font-bold neon-pink">{battle.shortPlayer.address}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-1">Start Price</div>
                      <div className="font-bold">${battle.startPrice?.toFixed(2)}</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-1">Stake</div>
                      <div className="font-bold">{battle.stakeAmount} {battle.currency}</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-1">Current Price</div>
                      <div className="font-bold">${currentBTCPrice?.toFixed(2) || "..."}</div>
                    </div>
                  </div>

                  {!battle.resolved && (
                    <div className="mt-6">
                      <Countdown
                        startTime={new Date(battle.startTime).getTime() / 1000}
                        duration={BATTLE_DURATION}
                        onComplete={() => {
                          if (canResolve && !battle.resolved) {
                            handleResolveBattle(battle.id);
                          }
                        }}
                      />
                      {canResolve && (
                        <button
                          onClick={() => handleResolveBattle(battle.id)}
                          disabled={isPending}
                          className="w-full mt-4 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPending ? "Resolving..." : "Resolve Battle"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Position Selection Interface */}
            {(!battle || battle.status !== "active") && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
              >
                {/* Market Data Section: Graphique + Carnet d'ordres */}
                <div className="mb-8 grid lg:grid-cols-3 gap-6 items-stretch">
                  {/* Graphique + Betting - 2/3 de la largeur */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <BattleChart />
                    <BattleBetting
                      onEnterBattle={handleEnterRoom}
                      isPending={isPending}
                      selectedPosition={selectedPosition}
                      battle={battle}
                    />
                  </div>
                  {/* Carnet d'ordres - 1/3 de la largeur */}
                  <div className="lg:col-span-1 flex flex-col">
                    <OrderBook />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Battle History */}
            {battleHistory && battleHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8 neon-text">
                  Battle <span className="neon-cyan">History</span>
                </h2>
                <div className="grid gap-6 max-w-4xl mx-auto">
                  {battleHistory.slice(0, 10).map((battleItem: any) => (
                    <div key={battleItem.id} className="glass-strong rounded-xl p-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Status</div>
                          <div className={`font-bold ${
                            battleItem.status === "resolved" ? "text-green-400" : "text-yellow-400"
                          }`}>
                            {battleItem.status === "resolved" ? "Resolved" : "Active"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Stake</div>
                          <div className="font-bold">{battleItem.stakeAmount} {battleItem.currency}</div>
                        </div>
                        {battleItem.winner && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Winner</div>
                            <div className="font-bold neon-cyan">{battleItem.winner.address}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
