"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useRealtimePrice } from "@/hooks/useRealtimePrice";
import { useCandlestickData } from "@/hooks/useCandlestickData";

export function BattleChart() {
  const { data: priceData, isLoading: priceLoading } = useRealtimePrice();
  const { candlesticks, isLoading: candlesticksLoading } = useCandlestickData();
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
    activeIndex: number | null;
    price: number | null;
    time: string | null;
  } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Formater les données pour le graphique avec temps relatif (compte à rebours)
  const chartData = useMemo(() => {
    if (priceData.length === 0) return [];

    // Trouver le timestamp le plus récent (le dernier point = maintenant)
    const latestTimestamp = Math.max(...priceData.map((p) => p.timestamp));

    // Fonction pour formater le temps relatif en compte à rebours (MM:SS)
    const formatRelativeTime = (timestamp: number): string => {
      const diffSeconds = Math.max(
        0,
        Math.floor((latestTimestamp - timestamp) / 1000)
      );
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    };

    return priceData.map((point) => ({
      time: point.time,
      relativeTime: formatRelativeTime(point.timestamp),
      price: point.price,
      timestamp: point.timestamp,
    }));
  }, [priceData]);

  // Calculer les stats pour le gradient
  const stats = useMemo(() => {
    if (chartData.length === 0) return { isUp: true };
    const firstPrice = chartData[0].price;
    const lastPrice = chartData[chartData.length - 1].price;
    return { isUp: lastPrice >= firstPrice };
  }, [chartData]);

  const gradientColor = stats.isUp ? "#00ffff" : "#ff00ff";

  // Gérer le mouvement de la souris sur le graphique
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!chartContainerRef.current) return;

      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Trouver l'index le plus proche basé sur la position X
      if (chartData.length > 0) {
        const chartWidth = rect.width;
        const dataIndex = Math.min(
          Math.floor((x / chartWidth) * chartData.length),
          chartData.length - 1
        );

        if (dataIndex >= 0 && dataIndex < chartData.length) {
          const dataPoint = chartData[dataIndex];
          setMousePosition({
            x,
            y,
            activeIndex: dataIndex,
            price: dataPoint.price,
            time: dataPoint.time,
          });
        }
      }
    },
    [chartData]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePosition(null);
  }, []);

  if (priceLoading || candlesticksLoading) {
    return (
      <div className="glass-strong rounded-xl p-8 text-center">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="glass-strong rounded-xl p-8 text-center">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const priceChange =
    chartData.length > 1
      ? ((currentPrice - chartData[0].price) / chartData[0].price) * 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-xl p-6 backdrop-blur-xl relative"
      ref={chartContainerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* En-tête avec prix actuel */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xl font-bold neon-text flex items-center gap-2">
              <span>₿</span> BTC/USD
            </h3>
            <p className="text-sm text-gray-400 mt-1">5 dernières minutes</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold neon-cyan">
              $
              {currentPrice.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div
              className={`text-sm mt-1 ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange >= 0 ? "↑" : "↓"} {Math.abs(priceChange).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="relativeTime"
              stroke="#888"
              tick={{ fill: "#888", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#888"
              tick={{ fill: "#888", fontSize: 10 }}
              domain={["auto", "auto"]}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: `1px solid ${gradientColor}`,
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [
                `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                "Price",
              ]}
            />
            {mousePosition && mousePosition.activeIndex !== null && (
              <ReferenceLine
                x={chartData[mousePosition.activeIndex]?.relativeTime}
                stroke={gradientColor}
                strokeDasharray="5 5"
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            <Line
              type="monotone"
              dataKey="price"
              stroke={gradientColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: gradientColor }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Réticule personnalisé qui suit la souris */}
        {mousePosition && (
          <motion.div
            className="absolute pointer-events-none z-10"
            style={{
              left: mousePosition.x,
              top: 0,
              width: 1,
              height: "100%",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Ligne verticale pointillée */}
            <div
              className="h-full w-full"
              style={{
                background: `repeating-linear-gradient(
                  to bottom,
                  ${gradientColor} 0px,
                  ${gradientColor} 4px,
                  transparent 4px,
                  transparent 8px
                )`,
                opacity: 0.6,
              }}
            />

            {/* Tooltip à côté du curseur */}
            <div
              className="absolute left-4 top-1/2 transform -translate-y-1/2 glass rounded-lg px-3 py-2 text-sm"
              style={{
                border: `1px solid ${gradientColor}`,
              }}
            >
              <div className="text-xs text-gray-400 mb-1">
                {mousePosition.activeIndex !== null &&
                mousePosition.activeIndex < chartData.length
                  ? chartData[mousePosition.activeIndex].relativeTime
                  : mousePosition.time}
              </div>
              <div
                className={`font-bold ${
                  stats.isUp ? "text-cyan-400" : "text-pink-400"
                }`}
              >
                $
                {mousePosition.price?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Affichage des bougies en mini-format sous le graphique */}
      {candlesticks.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-2">
            Candlesticks (5 minutes)
          </div>
          <div className="flex gap-1 justify-between">
            {candlesticks.map((candle, index) => {
              const isUp = candle.close >= candle.open;
              const allCandles = candlesticks;
              const minPrice = Math.min(...allCandles.map((c) => c.low));
              const maxPrice = Math.max(...allCandles.map((c) => c.high));
              const priceRange = maxPrice - minPrice;

              // Calculer les positions relatives dans la hauteur disponible
              const candleHeight = 64; // hauteur en px
              const highY =
                priceRange > 0
                  ? ((maxPrice - candle.high) / priceRange) * candleHeight
                  : 0;
              const lowY =
                priceRange > 0
                  ? ((maxPrice - candle.low) / priceRange) * candleHeight
                  : candleHeight;
              const openY =
                priceRange > 0
                  ? ((maxPrice - candle.open) / priceRange) * candleHeight
                  : candleHeight / 2;
              const closeY =
                priceRange > 0
                  ? ((maxPrice - candle.close) / priceRange) * candleHeight
                  : candleHeight / 2;

              const bodyTop = Math.min(openY, closeY);
              const bodyBottom = Math.max(openY, closeY);
              const bodyHeight = Math.max(bodyBottom - bodyTop, 2); // Minimum 2px
              const wickTopHeight = Math.max(highY, 0);
              const wickBottomHeight = Math.max(candleHeight - lowY, 0);

              return (
                <div
                  key={index}
                  className="flex-1 relative glass rounded p-1"
                  style={{ height: `${candleHeight}px` }}
                  title={`O: $${candle.open.toFixed(
                    2
                  )} H: $${candle.high.toFixed(2)} L: $${candle.low.toFixed(
                    2
                  )} C: $${candle.close.toFixed(2)}`}
                >
                  {/* Mèche supérieure */}
                  {wickTopHeight > 0 && (
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 w-px"
                      style={{
                        height: `${wickTopHeight}px`,
                        top: 0,
                        background: isUp ? "#00ffff" : "#ff00ff",
                      }}
                    />
                  )}
                  {/* Corps de la bougie */}
                  <div
                    className={`absolute left-1/2 transform -translate-x-1/2 w-3/4 rounded ${
                      isUp ? "bg-cyan-500" : "bg-pink-500"
                    }`}
                    style={{
                      height: `${bodyHeight}px`,
                      top: `${bodyTop}px`,
                      opacity: 0.8,
                    }}
                  />
                  {/* Mèche inférieure */}
                  {wickBottomHeight > 0 && (
                    <div
                      className="absolute left-1/2 transform -translate-x-1/2 w-px"
                      style={{
                        height: `${wickBottomHeight}px`,
                        bottom: 0,
                        background: isUp ? "#00ffff" : "#ff00ff",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
