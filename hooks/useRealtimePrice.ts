"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface RealtimePricePoint {
  time: string;
  price: number;
  timestamp: number;
}

export function useRealtimePrice() {
  const [data, setData] = useState<RealtimePricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      const result = await apiClient.getRealtimePrice();
      setData(result.data);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching realtime price:', err);
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

  return { data, isLoading, error, refetch: fetchData };
}

