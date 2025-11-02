"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  walletAddress: string;
  balanceETH: number;
  balanceUSDT: number;
}

export function useWallet() {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Vérifier le token et récupérer les infos utilisateur
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Récupérer les infos utilisateur complètes
      const { user: userData } = await apiClient.getMe();
      setUser(userData);
      setIsConnected(true);
    } catch {
      // Token invalide
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setIsConnected(false);
      setUser(null);
    }
  };

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Vérifier si MetaMask est installé
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Demander la connexion au wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No account found');
      }

      const walletAddress = accounts[0];

      // Demander le challenge
      const { message, nonce } = await apiClient.getChallenge(walletAddress);

      // Demander la signature
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Vérifier la signature avec le backend
      const { token, user: userData } = await apiClient.verify(walletAddress, signature);

      // Stocker le token
      apiClient.setToken(token);
      
      // Mettre à jour l'état
      setUser(userData);
      setIsConnected(true);
      
      // Rafraîchir les infos utilisateur pour être sûr
      try {
        const { user: freshUser } = await apiClient.getMe();
        setUser(freshUser);
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setIsConnected(false);
      setUser(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setUser(null);
    setIsConnected(false);
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
  };

  return {
    user,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    address: user?.walletAddress || null,
  };
}

