"use client";

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

// Dashboard Stats
export function useDashboardStats() {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminDashboard();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading, error, refetch: fetchStats };
}

// Deposits Chart
export function useDepositsChart(period: 'day' | 'week' | 'month' = 'day') {
  const [chartData, setChartData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchChart = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminDepositsChart(period);
      setChartData(data);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching deposits chart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChart();
  }, [period]);

  return { chartData, isLoading, error, refetch: fetchChart };
}

// Transactions
export function useTransactions(filters?: {
  type?: string;
  status?: string;
  currency?: string;
  limit?: number;
  offset?: number;
}) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminTransactions(filters);
      setTransactions(data.transactions);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters?.type, filters?.status, filters?.currency, filters?.limit, filters?.offset]);

  return { transactions, total, isLoading, error, refetch: fetchTransactions };
}

// Withdrawals
export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminWithdrawals();
      setWithdrawals(data.withdrawals);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching withdrawals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchWithdrawals, 10000);
    return () => clearInterval(interval);
  }, []);

  const approveWithdrawal = async (id: string) => {
    try {
      await apiClient.approveWithdrawal(id);
      await fetchWithdrawals(); // Refresh list
      return true;
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      throw err;
    }
  };

  const rejectWithdrawal = async (id: string, reason?: string) => {
    try {
      await apiClient.rejectWithdrawal(id, reason);
      await fetchWithdrawals(); // Refresh list
      return true;
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      throw err;
    }
  };

  return {
    withdrawals,
    isLoading,
    error,
    refetch: fetchWithdrawals,
    approveWithdrawal,
    rejectWithdrawal,
  };
}

