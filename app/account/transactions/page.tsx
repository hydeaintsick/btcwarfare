"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] =
    useState<string>("");

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

  const handleShowRejectionReason = (reason: string) => {
    setSelectedRejectionReason(reason);
    setRejectionModalOpen(true);
  };

  const handleCloseRejectionModal = () => {
    setRejectionModalOpen(false);
    setSelectedRejectionReason("");
  };

  if (loading) {
    return (
      <>
        <h2 className="text-3xl font-bold mb-6 neon-text">
          Transaction History
        </h2>
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
                <tr
                  key={tx.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 capitalize">{tx.type}</td>
                  <td className="py-3 px-4">
                    {tx.amount.toFixed(10)} {tx.currency}
                  </td>
                  <td className="py-3 px-4 text-gray-400">
                    {tx.fee ? `${tx.fee.toFixed(10)} ${tx.currency}` : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          tx.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : tx.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                      {tx.status === "rejected" && tx.rejectionReason && (
                        <button
                          onClick={() =>
                            handleShowRejectionReason(tx.rejectionReason)
                          }
                          className="w-5 h-5 flex items-center justify-center bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-full text-xs font-bold transition-colors cursor-pointer"
                          title="View rejection reason"
                        >
                          i
                        </button>
                      )}
                    </div>
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

      {/* Rejection Reason Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseRejectionModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 glass-strong rounded-xl p-6 max-w-md w-full border border-red-500/30"
          >
            <h3 className="text-2xl font-bold mb-4 neon-text text-red-400">
              Rejection Reason
            </h3>

            <div className="mb-6">
              <p className="text-gray-300 whitespace-pre-wrap break-words">
                {selectedRejectionReason || "No reason provided"}
              </p>
            </div>

            <button
              onClick={handleCloseRejectionModal}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
