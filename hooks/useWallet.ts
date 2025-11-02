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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkInitialAuth = async () => {
      setIsCheckingAuth(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Vérifier le token et récupérer les infos utilisateur
        await checkAuth();
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkInitialAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const refreshUser = async () => {
    try {
      const { user: userData } = await apiClient.getMe();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      return null;
    }
  };

  const sendTransaction = async (
    to: string,
    amount: number,
    currency: 'ETH' | 'USDT' = 'ETH'
  ): Promise<{ hash: string; receipt?: any }> => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (currency === 'ETH') {
        // Transaction ETH native
        const tx = await signer.sendTransaction({
          to,
          value: ethers.parseEther(amount.toString()),
        });

        // Retourner le hash immédiatement - MetaMask a déjà confirmé l'envoi
        // La confirmation blockchain se fera via polling côté frontend
        // Note: tx.hash est disponible immédiatement après sendTransaction
        return { hash: tx.hash, receipt: null };
      } else {
        // Transaction USDT (ERC20)
        // ABI minimal pour transfer
        const erc20Abi = [
          'function transfer(address to, uint256 amount) external returns (bool)',
        ];

        // Adresse du contrat USDT (mainnet)
        const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
        
        const contract = new ethers.Contract(USDT_ADDRESS, erc20Abi, signer);
        
        // USDT a 6 décimales
        const amountWei = ethers.parseUnits(amount.toString(), 6);
        
        const tx = await contract.transfer(to, amountWei);
        const receipt = await tx.wait();
        
        return { hash: tx.hash, receipt };
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to send transaction');
    }
  };

  return {
    user,
    isConnected,
    isConnecting: isConnecting || isCheckingAuth,
    error,
    connect,
    disconnect,
    sendTransaction,
    refreshUser,
    address: user?.walletAddress || null,
  };
}

