"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await apiClient.getTransactions();
      setTransactions(data.transactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <h2 className="text-3xl font-bold mb-6 neon-text">Transaction History</h2>
        <p className="text-gray-400 text-center py-12">Loading...</p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-6 neon-text">Transaction History</h2>
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400">Fee</th>
                <th className="text-left py-3 px-4 text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 capitalize">{tx.type}</td>
                  <td className="py-3 px-4">
                    {tx.amount.toFixed(6)} {tx.currency}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {tx.fee ? `${tx.fee.toFixed(6)} ${tx.currency}` : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === "completed" ? "bg-green-500/20 text-green-400" :
                      tx.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-400 text-center py-12">No transactions yet</p>
      )}
    </>
  );
}

