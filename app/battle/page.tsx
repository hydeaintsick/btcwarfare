"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/WalletConnect";
import { Countdown } from "@/components/Countdown";
import { BattleCard } from "@/components/BattleCard";
import { BattleCardWrapper } from "@/components/BattleCardWrapper";
import {
  useBTCWarfare,
  useBattle,
  usePlayerBattles,
  useIsInQueue,
  useCurrentBTCPrice,
  BATTLE_DURATION,
} from "@/hooks/useContract";
import { formatEther } from "viem";

export default function BattlePage() {
  const { address, isConnected } = useAccount();
  const [selectedPosition, setSelectedPosition] = useState<"long" | "short" | null>(null);
  const [currentBattleId, setCurrentBattleId] = useState<bigint | undefined>(undefined);

  const { enterRoom, resolveBattle, hash, isPending, isConfirming, isConfirmed } =
    useBTCWarfare();
  const { battle } = useBattle(currentBattleId);
  const { battleIds } = usePlayerBattles(address);
  const { inQueue: isLongInQueue } = useIsInQueue(address, true);
  const { inQueue: isShortInQueue } = useIsInQueue(address, false);
  const { priceUSD: currentBTCPrice } = useCurrentBTCPrice();

  const inQueue = isLongInQueue || isShortInQueue;
  const queuePosition = isLongInQueue ? "long" : isShortInQueue ? "short" : null;

  // Mettre à jour la battle actuelle si une nouvelle battle est créée
  useEffect(() => {
    if (battleIds && battleIds.length > 0) {
      // Prendre la dernière battle (la plus récente)
      const latestBattleId = battleIds[battleIds.length - 1];
      if (!currentBattleId || latestBattleId !== currentBattleId) {
        setCurrentBattleId(latestBattleId);
      }
    }
  }, [battleIds, currentBattleId]);

  // Écouter les événements de battle créée
  useEffect(() => {
    if (isConfirmed && hash && !currentBattleId) {
      // Attendre un peu pour que la battle soit créée
      setTimeout(() => {
        if (battleIds && battleIds.length > 0) {
          setCurrentBattleId(battleIds[battleIds.length - 1]);
        }
      }, 2000);
    }
  }, [isConfirmed, hash, battleIds, currentBattleId]);

  const handleEnterRoom = async (isLong: boolean) => {
    if (!isConnected) {
      alert("Veuillez connecter votre wallet");
      return;
    }

    try {
      setSelectedPosition(isLong ? "long" : "short");
      await enterRoom(isLong);
    } catch (error: any) {
      console.error("Error entering room:", error);
      alert(error?.message || "Erreur lors de l'entrée dans la room");
      setSelectedPosition(null);
    }
  };

  const handleResolveBattle = async (battleId: bigint) => {
    try {
      await resolveBattle(battleId);
    } catch (error: any) {
      console.error("Error resolving battle:", error);
      alert(error?.message || "Erreur lors de la résolution de la battle");
    }
  };

  // Vérifier si la battle peut être résolue (60 secondes écoulées)
  const canResolve = battle
    ? Number(battle.startTime) + BATTLE_DURATION <= Math.floor(Date.now() / 1000)
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
            {battle && battle.longPlayer !== "0x0000000000000000000000000000000000000000" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto mb-8"
              >
                <BattleCard
                  battleId={currentBattleId!}
                  longPlayer={battle.longPlayer as `0x${string}`}
                  shortPlayer={battle.shortPlayer as `0x${string}`}
                  startPrice={battle.startPrice}
                  startTime={battle.startTime}
                  currentPrice={currentBTCPrice ? BigInt(Math.floor(currentBTCPrice * 1e8)) : undefined}
                  stakeAmount={battle.stakeAmount}
                  resolved={battle.resolved}
                  winner={battle.winner as `0x${string}` | undefined}
                  onResolve={canResolve && !battle.resolved ? handleResolveBattle : undefined}
                />

                {!battle.resolved && (
                  <div className="mt-8">
                    <Countdown
                      startTime={battle.startTime}
                      duration={BATTLE_DURATION}
                      onComplete={() => {
                        // Auto-résoudre si le joueur est dans la battle
                        if (canResolve && !battle.resolved) {
                          handleResolveBattle(currentBattleId!);
                        }
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Interface de sélection Long/Short */}
            {!battle && !inQueue && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="glass-strong rounded-xl p-8 mb-8 text-center">
                  <h2 className="text-3xl font-bold mb-4 neon-text">
                    Choisissez votre <span className="neon-cyan">position</span>
                  </h2>
                  <p className="text-gray-300 mb-8">
                    Mise: <span className="font-bold neon-cyan">0.0015 ETH</span>
                  </p>
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
                        disabled={isPending || isConfirming}
                        className="w-full py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending || isConfirming ? "En attente..." : "Entrer en Long"}
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
                        disabled={isPending || isConfirming}
                        className="w-full py-3 bg-neon-pink text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-pink disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending || isConfirming ? "En attente..." : "Entrer en Short"}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* En attente de matching */}
            {inQueue && !battle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-strong rounded-xl p-8 max-w-2xl mx-auto text-center"
              >
                <div className="text-6xl mb-4 animate-pulse-neon">⏳</div>
                <h2 className="text-2xl font-bold neon-text mb-4">
                  En attente de matching...
                </h2>
                <p className="text-gray-300 mb-4">
                  Position: <span className="font-bold">{queuePosition?.toUpperCase()}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Recherche d&apos;un adversaire opposé...
                </p>
                {(isPending || isConfirming) && (
                  <div className="mt-6">
                    <div className="text-sm text-gray-400">Transaction en cours...</div>
                    {hash && (
                      <div className="text-xs text-gray-500 mt-2 break-all">{hash}</div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Historique des battles */}
            {battleIds && battleIds.length > 0 && !battle && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12"
              >
                <h2 className="text-3xl font-bold text-center mb-8 neon-text">
                  Vos <span className="neon-cyan">Battles</span>
                </h2>
                <div className="grid gap-6 max-w-4xl mx-auto">
                  {battleIds.map((battleId) => (
                    <BattleCardWrapper
                      key={battleId.toString()}
                      battleId={battleId}
                      onResolve={
                        canResolve
                          ? () => handleResolveBattle(battleId)
                          : undefined
                      }
                    />
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
