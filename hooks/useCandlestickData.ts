"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface Candlestick {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
}

export function useCandlestickData() {
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      const result = await apiClient.getCandlesticks();
      setCandlesticks(result.candlesticks);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching candlesticks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immédiatement
    fetchData();

    // Puis toutes les 2 secondes
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  return { candlesticks, isLoading, error, refetch: fetchData };
}

