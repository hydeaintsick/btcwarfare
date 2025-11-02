"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useBinanceData } from "@/hooks/useBinanceData";

export function BitcoinChart() {
  const { data, isLoading, error, currentPrice, stats } = useBinanceData();

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-strong rounded-xl p-8 text-center"
      >
        <p className="text-red-400">Failed to load Bitcoin data</p>
      </motion.div>
    );
  }

  if (isLoading || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-strong rounded-xl p-8 text-center"
      >
        <div className="animate-pulse">
          <div className="h-64 bg-gray-800 rounded-lg"></div>
        </div>
      </motion.div>
    );
  }

  // Gradient color based on trend
  const isUp = stats && stats.change24h >= 0;
  const gradientColor = isUp ? "#00ffff" : "#ff00ff";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="glass-strong rounded-xl p-6 backdrop-blur-xl"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold neon-text flex items-center gap-2">
              <span>₿</span> Bitcoin 24h
            </h3>
            <p className="text-sm text-gray-400 mt-1">Last 24 hours price action</p>
          </div>
          {currentPrice && (
            <div className="text-right">
              <div className="text-3xl font-bold neon-cyan">
                ${currentPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              {stats && (
                <div
                  className={`text-sm mt-1 ${
                    stats.change24h >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stats.change24h >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(stats.change24h).toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="glass rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">24h High</div>
              <div className="text-lg font-bold neon-cyan">
                ${stats.max.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">24h Low</div>
              <div className="text-lg font-bold neon-pink">
                ${stats.min.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="glass rounded-lg p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Change</div>
              <div
                className={`text-lg font-bold ${
                  stats.change24h >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.change24h >= 0 ? "+" : ""}
                {stats.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="time"
              stroke="#888"
              tick={{ fill: "#888", fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#888"
              tick={{ fill: "#888", fontSize: 12 }}
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
            <Area
              type="monotone"
              dataKey="price"
              stroke={gradientColor}
              strokeWidth={2}
              fill="url(#colorPrice)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

