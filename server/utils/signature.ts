import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

/**
 * Génère un nonce aléatoire pour l'authentification
 */
export const generateNonce = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Vérifie une signature Ethereum
 * @param message Message original
 * @param signature Signature fournie par le client
 * @param address Adresse du wallet qui doit avoir signé
 */
export const verifySignature = (message: string, signature: string, address: string): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Crée un message à signer pour l'authentification
 * @param address Adresse du wallet
 * @param nonce Nonce unique
 */
export const createAuthMessage = (address: string, nonce: string): string => {
  return `Welcome to BTCWarfare!\n\nSign this message to authenticate.\n\nAddress: ${address}\nNonce: ${nonce}`;
};

