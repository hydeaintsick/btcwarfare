"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useBattleHistory } from "@/hooks/useAPI";
import { formatAddress } from "@/lib/utils";

export default function BattlesPage() {
  const { battles: battleHistory } = useBattleHistory();

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 neon-text">Battle History</h2>
      {battleHistory && battleHistory.length > 0 ? (
        <div className="space-y-4">
          {battleHistory.map((battle: any) => (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-lg p-6"
            >
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Status</div>
                  <div className={`font-bold ${
                    battle.status === "resolved" ? "text-green-400" : "text-yellow-400"
                  }`}>
                    {battle.status === "resolved" ? "Resolved" : "Active"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Stake</div>
                  <div className="font-bold">{battle.stakeAmount} {battle.currency}</div>
                </div>
                {battle.winner && (
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Winner</div>
                    <div className="font-bold neon-cyan">{formatAddress(battle.winner.address)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-400 mb-1">Date</div>
                  <div className="text-sm">{new Date(battle.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-center py-12">No battles yet</p>
      )}
    </>
  );
}

