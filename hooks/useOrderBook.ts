"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
  spread?: number;
}

export function useOrderBook() {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      const result = await apiClient.getOrderBook();
      
      // Formater les données
      const bids: OrderBookEntry[] = result.bids.map(([price, quantity]) => ({
        price,
        quantity,
      }));
      
      const asks: OrderBookEntry[] = result.asks.map(([price, quantity]) => ({
        price,
        quantity,
      }));

      // Calculer le spread
      const spread =
        bids.length > 0 && asks.length > 0
          ? asks[0].price - bids[0].price
          : undefined;

      setOrderBook({
        bids,
        asks,
        timestamp: result.timestamp,
        spread,
      });
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching orderbook:', err);
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

  return { orderBook, isLoading, error, refetch: fetchData };
}

