export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: bigint): string {
  const divisor = BigInt(10 ** 18);
  const quotient = wei / divisor;
  const remainder = wei % divisor;
  return `${quotient}.${remainder.toString().padStart(18, "0")}`;
}

/**
 * Obtenir le symbole de la devise native selon le réseau
 * @param chainId ID de la chaîne
 * @returns "ETH" pour tous les réseaux supportés (Ethereum, Arbitrum)
 */
export function getNativeCurrencySymbol(chainId?: number): string {
  // Tous les réseaux supportés utilisent ETH
  // - Ethereum Mainnet (1)
  // - Ethereum Sepolia (11155111)
  // - Arbitrum Mainnet (42161)
  // - Arbitrum Sepolia (421614)
  return "ETH";
}
