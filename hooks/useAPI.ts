"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// BTC Price
export function useCurrentBTCPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrice = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getBTCPrice();
      setPrice(data.price);
      setError(null);
    } catch (err: any) {
      setError(err);
      setPrice(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, []);

  return { priceUSD: price, isLoading, error };
}

// Wallet Balance
export function useBalance() {
  const [balanceETH, setBalanceETH] = useState<number>(0);
  const [balanceUSDT, setBalanceUSDT] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      const data = await apiClient.getBalance();
      setBalanceETH(data.balanceETH);
      setBalanceUSDT(data.balanceUSDT);
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 3000); // Rafraîchir toutes les 3 secondes
    return () => clearInterval(interval);
  }, []);

  return { balanceETH, balanceUSDT, isLoading, refetch: fetchBalance };
}

// Current Battle
export function useCurrentBattle() {
  const [battle, setBattle] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBattle = async () => {
    try {
      const data = await apiClient.getCurrentBattle();
      setBattle(data.battle);
    } catch (err) {
      console.error('Error fetching battle:', err);
      setBattle(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBattle();
    const interval = setInterval(fetchBattle, 2000); // Rafraîchir toutes les 2 secondes
    return () => clearInterval(interval);
  }, []);

  return { battle, isLoading, refetch: fetchBattle };
}

// Battle History
export function useBattleHistory() {
  const [battles, setBattles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const data = await apiClient.getBattleHistory();
      setBattles(data.battles);
    } catch (err) {
      console.error('Error fetching battle history:', err);
      setBattles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return { battles, isLoading, refetch: fetchHistory };
}

// Battle Actions
export function useBattleActions() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enterBattle = async (position: 'long' | 'short', currency: 'ETH' | 'USDT') => {
    try {
      setIsPending(true);
      setError(null);
      const result = await apiClient.enterBattle(position, currency);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to enter battle');
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  const resolveBattle = async (battleId: string) => {
    try {
      setIsPending(true);
      setError(null);
      await apiClient.resolveBattle(battleId);
    } catch (err: any) {
      setError(err.message || 'Failed to resolve battle');
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    enterBattle,
    resolveBattle,
    isPending,
    error,
  };
}

export const BATTLE_DURATION = 60; // 60 secondes

