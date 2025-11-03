"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMessage = exports.verifySignature = exports.generateNonce = void 0;
const ethers_1 = require("ethers");
const crypto_1 = require("crypto");
/**
 * Génère un nonce aléatoire pour l'authentification
 */
const generateNonce = () => {
    return (0, crypto_1.randomBytes)(32).toString('hex');
};
exports.generateNonce = generateNonce;
/**
 * Vérifie une signature Ethereum
 * @param message Message original
 * @param signature Signature fournie par le client
 * @param address Adresse du wallet qui doit avoir signé
 */
const verifySignature = (message, signature, address) => {
    try {
        const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === address.toLowerCase();
    }
    catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};
exports.verifySignature = verifySignature;
/**
 * Crée un message à signer pour l'authentification
 * @param address Adresse du wallet
 * @param nonce Nonce unique
 */
const createAuthMessage = (address, nonce) => {
    return `Welcome to BTCWarfare!\n\nSign this message to authenticate.\n\nAddress: ${address}\nNonce: ${nonce}`;
};
exports.createAuthMessage = createAuthMessage;
