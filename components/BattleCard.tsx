"use client";

import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";
import { formatEther } from "viem";
import { useAccount } from "wagmi";

interface BattleCardProps {
  battleId: bigint;
  longPlayer: `0x${string}`;
  shortPlayer: `0x${string}`;
  startPrice: bigint;
  startTime: bigint;
  currentPrice?: bigint;
  stakeAmount: bigint;
  resolved: boolean;
  winner?: `0x${string}`;
  onResolve?: (battleId: bigint) => void;
}

export function BattleCard({
  battleId,
  longPlayer,
  shortPlayer,
  startPrice,
  startTime,
  currentPrice,
  stakeAmount,
  resolved,
  winner,
  onResolve,
}: BattleCardProps) {
  const { address } = useAccount();
  const isLong = address?.toLowerCase() === longPlayer.toLowerCase();
  const isShort = address?.toLowerCase() === shortPlayer.toLowerCase();
  const isPlayer = isLong || isShort;

  // Convertir les prix (8 décimales) en USD
  const startPriceUSD = Number(startPrice) / 1e8;
  const currentPriceUSD = currentPrice ? Number(currentPrice) / 1e8 : undefined;
  const priceChange = currentPriceUSD
    ? ((currentPriceUSD - startPriceUSD) / startPriceUSD) * 100
    : undefined;

  const isWinner = winner && address?.toLowerCase() === winner.toLowerCase();
  const stakeETH = formatEther(stakeAmount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl p-8 border-2 border-neon-cyan"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold neon-text neon-cyan mb-2">
            Battle #{battleId.toString()}
          </h3>
          {resolved && winner && (
            <div className="mt-2">
              {isWinner ? (
                <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-bold border border-green-500/30">
                  🏆 Gagnant !
                </span>
              ) : (
                <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-bold border border-red-500/30">
                  Perdu
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Mise</div>
          <div className="text-lg font-bold neon-cyan">{stakeETH} ETH</div>
        </div>
      </div>

      {/* Joueurs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div
          className={`glass rounded-lg p-4 border-2 ${
            isLong ? "border-neon-cyan" : "border-gray-600"
          }`}
        >
          <div className="text-sm text-gray-400 mb-1">Long</div>
          <div className="font-bold text-sm truncate">
            {isLong ? "Vous" : formatAddress(longPlayer)}
          </div>
        </div>
        <div
          className={`glass rounded-lg p-4 border-2 ${
            isShort ? "border-neon-pink" : "border-gray-600"
          }`}
        >
          <div className="text-sm text-gray-400 mb-1">Short</div>
          <div className="font-bold text-sm truncate">
            {isShort ? "Vous" : formatAddress(shortPlayer)}
          </div>
        </div>
      </div>

      {/* Prix */}
      <div className="glass rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-400">Prix de départ</div>
          <div className="font-bold">${startPriceUSD.toFixed(2)}</div>
        </div>
        {currentPriceUSD !== undefined && (
          <>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-400">Prix actuel</div>
              <div className="font-bold">${currentPriceUSD.toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">Variation</div>
              <div
                className={`font-bold ${
                  priceChange && priceChange > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {priceChange && priceChange > 0 ? "+" : ""}
                {priceChange?.toFixed(2)}%
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!resolved && isPlayer && (
        <button
          onClick={() => onResolve?.(battleId)}
          className="w-full py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan"
        >
          Résoudre la battle
        </button>
      )}

      {resolved && winner && (
        <div className="text-center mt-4">
          <div className="text-lg font-bold neon-text">
            Gagnant: {formatAddress(winner)}
          </div>
          {isWinner && (
            <div className="text-sm text-gray-300 mt-2">
              Vous avez remporté {formatEther(stakeAmount * BigInt(2) * BigInt(95) / BigInt(100))} ETH
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

