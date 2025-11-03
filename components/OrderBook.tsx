"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOrderBook } from "@/hooks/useOrderBook";
import { useEffect, useState } from "react";

export function OrderBook() {
  const { orderBook, isLoading, error } = useOrderBook();
  const [previousOrderBook, setPreviousOrderBook] = useState<typeof orderBook>(null);

  useEffect(() => {
    if (orderBook) {
      setPreviousOrderBook(orderBook);
    }
  }, [orderBook]);

  if (isLoading) {
    return (
      <div className="glass-strong rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !orderBook) {
    return (
      <div className="glass-strong rounded-xl p-6 text-center">
        <p className="text-red-400">Erreur lors du chargement du carnet d'ordres</p>
      </div>
    );
  }

  // Prendre les 10 meilleurs bids et asks
  const topBids = orderBook.bids.slice(0, 10);
  const topAsks = orderBook.asks.slice(0, 10);

  // Fonction pour comparer les prix et détecter les changements
  const getPriceChange = (price: number, isBid: boolean) => {
    if (!previousOrderBook) return null;
    const previousPrices = isBid ? previousOrderBook.bids : previousOrderBook.asks;
    const previousEntry = previousPrices.find((entry) => entry.price === price);
    if (!previousEntry) return null;
    return previousEntry.quantity !==
      (isBid ? orderBook.bids : orderBook.asks).find((e) => e.price === price)?.quantity;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-strong rounded-xl p-6 backdrop-blur-xl h-full flex flex-col"
    >
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-xl font-bold neon-text mb-2">Carnet d'ordres</h3>
        {orderBook.spread !== undefined && (
          <div className="text-sm text-gray-400">
            Spread:{" "}
            <span className="font-bold neon-cyan">
              ${orderBook.spread.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        {/* Asks (Ordres de vente - en haut, en magenta) */}
        <div className="flex-shrink-0 mb-4">
          <div className="text-xs text-gray-400 mb-2 px-2 flex justify-between">
            <span>Prix (Ask)</span>
            <span>Quantité</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            <AnimatePresence>
              {topAsks.map((ask, index) => {
                const hasChanged = getPriceChange(ask.price, false);
                return (
                  <motion.div
                    key={`ask-${ask.price}`}
                    initial={hasChanged ? { backgroundColor: "rgba(255, 0, 255, 0.3)" } : {}}
                    animate={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    transition={{ duration: 0.3 }}
                    className="glass rounded px-2 py-1 flex justify-between items-center hover:bg-opacity-80 transition-all"
                  >
                    <span className="text-pink-400 font-medium">
                      ${ask.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-300 text-sm">
                      {ask.quantity.toLocaleString("en-US", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-700 my-2 flex-shrink-0"></div>

        {/* Bids (Ordres d'achat - en bas, en cyan) */}
        <div className="flex-grow flex flex-col min-h-0">
          <div className="text-xs text-gray-400 mb-2 px-2 flex justify-between flex-shrink-0">
            <span>Prix (Bid)</span>
            <span>Quantité</span>
          </div>
          <div className="space-y-1 flex-grow overflow-y-auto min-h-0">
            <AnimatePresence>
              {topBids.map((bid, index) => {
                const hasChanged = getPriceChange(bid.price, true);
                return (
                  <motion.div
                    key={`bid-${bid.price}`}
                    initial={hasChanged ? { backgroundColor: "rgba(0, 255, 255, 0.3)" } : {}}
                    animate={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                    transition={{ duration: 0.3 }}
                    className="glass rounded px-2 py-1 flex justify-between items-center hover:bg-opacity-80 transition-all"
                  >
                    <span className="text-cyan-400 font-medium">
                      ${bid.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-gray-300 text-sm">
                      {bid.quantity.toLocaleString("en-US", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

