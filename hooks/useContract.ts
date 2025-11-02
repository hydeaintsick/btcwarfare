"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BTCWarfareABI, BTCWarfare_ADDRESS } from "@/lib/contracts";
import { formatEther } from "viem";

export function useBTCWarfare() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const enterRoom = async (isLong: boolean) => {
    try {
      await writeContract({
        address: BTCWarfare_ADDRESS as `0x${string}`,
        abi: BTCWarfareABI,
        functionName: "enterRoom",
        args: [isLong],
        value: BigInt("1500000000000000"), // 0.0015 ETH
      });
    } catch (err) {
      console.error("Error entering room:", err);
      throw err;
    }
  };

  const resolveBattle = async (battleId: bigint) => {
    try {
      await writeContract({
        address: BTCWarfare_ADDRESS as `0x${string}`,
        abi: BTCWarfareABI,
        functionName: "resolveBattle",
        args: [battleId],
      });
    } catch (err) {
      console.error("Error resolving battle:", err);
      throw err;
    }
  };

  const leaveQueue = async (isLong: boolean) => {
    try {
      await writeContract({
        address: BTCWarfare_ADDRESS as `0x${string}`,
        abi: BTCWarfareABI,
        functionName: "leaveQueue",
        args: [isLong],
      });
    } catch (err) {
      console.error("Error leaving queue:", err);
      throw err;
    }
  };

  return {
    enterRoom,
    resolveBattle,
    leaveQueue,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

export function useBattle(battleId: bigint | undefined) {
  const { data: battle, isLoading, error } = useReadContract({
    address: BTCWarfare_ADDRESS as `0x${string}`,
    abi: BTCWarfareABI,
    functionName: "getBattle",
    args: battleId ? [battleId] : undefined,
    query: {
      enabled: !!battleId,
      refetchInterval: 2000, // Rafraîchir toutes les 2 secondes
    },
  });

  return {
    battle,
    isLoading,
    error,
  };
}

export function usePlayerBattles(address: `0x${string}` | undefined) {
  const { data: battleIds, isLoading, error } = useReadContract({
    address: BTCWarfare_ADDRESS as `0x${string}`,
    abi: BTCWarfareABI,
    functionName: "getPlayerBattles",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000, // Rafraîchir toutes les 3 secondes
    },
  });

  return {
    battleIds: battleIds as bigint[] | undefined,
    isLoading,
    error,
  };
}

export function useIsInQueue(address: `0x${string}` | undefined, isLong: boolean) {
  const { data: inQueue, isLoading, error } = useReadContract({
    address: BTCWarfare_ADDRESS as `0x${string}`,
    abi: BTCWarfareABI,
    functionName: "isInQueue",
    args: address ? [address, isLong] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 2000,
    },
  });

  return {
    inQueue: inQueue as boolean | undefined,
    isLoading,
    error,
  };
}

export function useCurrentBTCPrice() {
  const { data: price, isLoading, error } = useReadContract({
    address: BTCWarfare_ADDRESS as `0x${string}`,
    abi: BTCWarfareABI,
    functionName: "getCurrentBTCPrice",
    query: {
      refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
    },
  });

  // Convertir le prix (8 décimales) en USD
  const priceUSD = price ? Number(price) / 1e8 : undefined;

  return {
    price: price as bigint | undefined,
    priceUSD,
    isLoading,
    error,
  };
}

