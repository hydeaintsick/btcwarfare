"use client";

import { BattleCard } from "./BattleCard";
import { useBattle, useCurrentBTCPrice } from "@/hooks/useContract";

interface BattleCardWrapperProps {
  battleId: bigint;
  onResolve?: (battleId: bigint) => void;
}

export function BattleCardWrapper({ battleId, onResolve }: BattleCardWrapperProps) {
  const { battle, isLoading } = useBattle(battleId);
  const { priceUSD: currentBTCPrice } = useCurrentBTCPrice();

  if (isLoading || !battle) {
    return (
      <div className="glass-strong rounded-xl p-8 text-center">
        <div className="text-gray-400">Chargement de la battle...</div>
      </div>
    );
  }

  if (battle.longPlayer === "0x0000000000000000000000000000000000000000") {
    return null;
  }

  return (
    <BattleCard
      battleId={battleId}
      longPlayer={battle.longPlayer as `0x${string}`}
      shortPlayer={battle.shortPlayer as `0x${string}`}
      startPrice={battle.startPrice}
      startTime={battle.startTime}
      currentPrice={currentBTCPrice ? BigInt(Math.floor(currentBTCPrice * 1e8)) : undefined}
      stakeAmount={battle.stakeAmount}
      resolved={battle.resolved}
      winner={battle.winner as `0x${string}` | undefined}
      onResolve={onResolve}
    />
  );
}

