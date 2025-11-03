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
  const { isConnected, address, isConnecting, connect } = useWallet();
  const [selectedPosition, setSelectedPosition] = useState<"long" | "short" | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<"ETH" | "USDT">("ETH");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Forcer un re-render quand isConnected change
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [isConnected]);

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
    console.log("handleEnterRoom called - isConnected:", isConnected, "isLong:", isLong);
    
    if (!isConnected) {
      console.log("Not connected, opening modal");
      setShowConnectModal(true);
      return;
    }

    try {
      console.log("Entering battle...");
      setSelectedPosition(isLong ? "long" : "short");
      await enterBattle(isLong ? "long" : "short", selectedCurrency);
      setSelectedPosition(null);
    } catch (error: any) {
      console.error("Error entering room:", error);
      alert(error?.message || "Error entering the room");
      setSelectedPosition(null);
    }
  };

  const handleConnect = async () => {
    try {
      console.log("Connecting wallet...");
      await connect();
      console.log("Wallet connected, isConnected:", isConnected);
      // Fermer la modal une fois connecté
      setShowConnectModal(false);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Fermer la modal si l'utilisateur se connecte
  useEffect(() => {
    console.log("useEffect - isConnected changed to:", isConnected);
    if (isConnected && showConnectModal) {
      console.log("Closing modal because connected");
      setShowConnectModal(false);
    }
  }, [isConnected, showConnectModal]);

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
                      key={`battle-betting-${isConnected}-${forceUpdate}`}
                      onEnterBattle={handleEnterRoom}
                      isPending={isPending}
                      selectedPosition={selectedPosition}
                      battle={battle}
                      isConnected={isConnected}
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

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConnectModal(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 glass-strong rounded-xl p-8 max-w-md w-full border-2 border-neon-cyan"
            style={{
              boxShadow: "0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)",
            }}
          >
            <div className="text-center">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center border-2 border-neon-cyan">
                  <svg
                    className="w-10 h-10 text-neon-cyan"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold neon-text mb-3">
                Connect Your <span className="neon-cyan">Wallet</span>
              </h2>

              {/* Message */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                You must connect your wallet to enter the battle. Connect with MetaMask to get started.
              </p>

              {/* Connect Button */}
              <motion.button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 px-6 bg-gradient-to-r from-neon-cyan to-neon-pink text-black font-bold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mb-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#F6851B" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#E2761B" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#CD6116" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#E4751F" />
                    </svg>
                    Connect with MetaMask
                  </span>
                )}
              </motion.button>

              {/* Close Button */}
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
