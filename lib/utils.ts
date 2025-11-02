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

