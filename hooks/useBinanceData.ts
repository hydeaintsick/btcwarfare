"use client";

import { useState, useEffect } from 'react';

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export function useBinanceData() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const fetchBinanceData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les données des dernières 24h avec intervalle de 1h
      const klinesResponse = await fetch(
        'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24'
      );
      
      if (!klinesResponse.ok) {
        throw new Error('Failed to fetch Binance data');
      }
      
      const klines: BinanceKline[] = await klinesResponse.json();
      
      // Transformer les données pour le graphique
      const chartData: ChartDataPoint[] = klines.map((kline: any) => {
        const timestamp = kline[0];
        const price = parseFloat(kline[4]); // close price
        
        // Formater l'heure pour l'affichage
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;
        
        return {
          time: timeStr,
          price,
          timestamp,
        };
      });
      
      setData(chartData);
      
      // Récupérer le prix actuel
      const tickerResponse = await fetch(
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'
      );
      
      if (tickerResponse.ok) {
        const ticker = await tickerResponse.json();
        setCurrentPrice(parseFloat(ticker.price));
      }
      
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching Binance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBinanceData();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchBinanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculer les stats
  const stats = data.length > 0 ? {
    min: Math.min(...data.map(d => d.price)),
    max: Math.max(...data.map(d => d.price)),
    change24h: data.length > 1 
      ? ((data[data.length - 1].price - data[0].price) / data[0].price) * 100 
      : 0,
  } : null;

  return { 
    data, 
    isLoading, 
    error, 
    currentPrice,
    stats,
    refetch: fetchBinanceData 
  };
}

