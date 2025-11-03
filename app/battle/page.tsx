"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
            {/* Current BTC Price */}
            {currentBTCPrice && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="glass rounded-lg px-6 py-4 inline-block">
                  <div className="text-sm text-gray-400 mb-1">BTC/USD Price</div>
                  <div className="text-3xl font-bold neon-cyan">${currentBTCPrice.toFixed(2)}</div>
                </div>
              </motion.div>
            )}

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
