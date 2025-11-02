"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { Countdown } from "@/components/Countdown";
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

  const handleEnterRoom = async (isLong: boolean) => {
    if (!isConnected) {
      alert("Veuillez connecter votre wallet");
      return;
    }

    try {
      setSelectedPosition(isLong ? "long" : "short");
      await enterBattle(isLong ? "long" : "short", selectedCurrency);
      setSelectedPosition(null);
    } catch (error: any) {
      console.error("Error entering room:", error);
      alert(error?.message || "Erreur lors de l'entrée dans la room");
      setSelectedPosition(null);
    }
  };

  const handleResolveBattle = async (battleId: string) => {
    try {
      await resolveBattle(battleId);
    } catch (error: any) {
      console.error("Error resolving battle:", error);
      alert(error?.message || "Erreur lors de la résolution de la battle");
    }
  };

  // Vérifier si la battle peut être résolue (60 secondes écoulées)
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
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <Link href="/" className="text-2xl font-bold neon-text neon-cyan hover:opacity-80">
            ← Retour
          </Link>
          <WalletConnect />
        </div>

        <h1 className="text-6xl font-bold text-center mb-8 neon-text neon-cyan">
          BATTLE <span className="neon-pink">ARENA</span>
        </h1>

        {!isConnected ? (
          <div className="glass-strong rounded-xl p-8 max-w-2xl mx-auto text-center">
            <p className="text-xl text-gray-300 mb-4">
              Connectez votre wallet pour commencer une battle
            </p>
          </div>
        ) : (
          <>
            {/* Prix BTC actuel */}
            {currentBTCPrice && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="glass rounded-lg px-6 py-4 inline-block">
                  <div className="text-sm text-gray-400 mb-1">Prix BTC/USD</div>
                  <div className="text-3xl font-bold neon-cyan">${currentBTCPrice.toFixed(2)}</div>
                </div>
              </motion.div>
            )}

            {/* Battle en cours */}
            {battle && battle.status === "active" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto mb-8"
              >
                <div className="glass-strong rounded-xl p-8">
                  <h2 className="text-2xl font-bold mb-6 neon-text">Battle en cours</h2>
                  
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
                      <div className="text-sm text-gray-400 mb-1">Prix de départ</div>
                      <div className="font-bold">${battle.startPrice?.toFixed(2)}</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-1">Mise</div>
                      <div className="font-bold">{battle.stakeAmount} {battle.currency}</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-400 mb-1">Prix actuel</div>
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
                          {isPending ? "Résolution..." : "Résoudre la battle"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Interface de sélection Long/Short */}
            {(!battle || battle.status !== "active") && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="glass-strong rounded-xl p-8 mb-8 text-center">
                  <h2 className="text-3xl font-bold mb-4 neon-text">
                    Choisissez votre <span className="neon-cyan">position</span>
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Mise: <span className="font-bold neon-cyan">0.0015 {selectedCurrency}</span>
                  </p>
                  
                  {/* Sélection devise */}
                  <div className="mb-6 flex justify-center gap-4">
                    <button
                      onClick={() => setSelectedCurrency("ETH")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCurrency === "ETH"
                          ? "bg-neon-cyan text-black"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      ETH
                    </button>
                    <button
                      onClick={() => setSelectedCurrency("USDT")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedCurrency === "USDT"
                          ? "bg-neon-cyan text-black"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      USDT
                    </button>
                  </div>

                  <p className="text-sm text-gray-400 mb-8">
                    Vous serez automatiquement matché avec un adversaire opposé
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Long */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.95 }}
                      className="glass rounded-xl p-8 border-2 border-neon-cyan cursor-pointer hover:border-opacity-80"
                      onClick={() => handleEnterRoom(true)}
                    >
                      <div className="text-5xl mb-4">📈</div>
                      <h3 className="text-2xl font-bold neon-cyan mb-4">LONG</h3>
                      <p className="text-gray-300 mb-4">
                        Vous pariez que le prix va monter
                      </p>
                      <button
                        disabled={isPending || selectedPosition === "long"}
                        className="w-full py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending && selectedPosition === "long" ? "En attente..." : "Entrer en Long"}
                      </button>
                    </motion.div>

                    {/* Short */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.95 }}
                      className="glass rounded-xl p-8 border-2 border-neon-pink cursor-pointer hover:border-opacity-80"
                      onClick={() => handleEnterRoom(false)}
                    >
                      <div className="text-5xl mb-4">📉</div>
                      <h3 className="text-2xl font-bold neon-pink mb-4">SHORT</h3>
                      <p className="text-gray-300 mb-4">
                        Vous pariez que le prix va descendre
                      </p>
                      <button
                        disabled={isPending || selectedPosition === "short"}
                        className="w-full py-3 bg-neon-pink text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-pink disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending && selectedPosition === "short" ? "En attente..." : "Entrer en Short"}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Historique des battles */}
            {battleHistory && battleHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8 neon-text">
                  Historique des <span className="neon-cyan">Battles</span>
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
                            {battleItem.status === "resolved" ? "Résolue" : "Active"}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Mise</div>
                          <div className="font-bold">{battleItem.stakeAmount} {battleItem.currency}</div>
                        </div>
                        {battleItem.winner && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Gagnant</div>
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
