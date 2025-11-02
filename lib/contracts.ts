// ABI du contrat BTCWarfare
// Note: À remplacer par l'ABI réel après déploiement
export const BTCWarfareABI = [
  "function enterRoom(bool isLong) payable",
  "function resolveBattle(uint256 battleId)",
  "function leaveQueue(bool isLong)",
  "function getBattle(uint256 battleId) view returns (tuple(address longPlayer, address shortPlayer, uint256 startPrice, uint256 startTime, uint256 stakeAmount, bool resolved, address winner))",
  "function getPlayerBattles(address player) view returns (uint256[])",
  "function isInQueue(address player, bool isLong) view returns (bool)",
  "function getCurrentBTCPrice() view returns (uint256)",
  "function MVP_ROOM_STAKE() view returns (uint256)",
  "function BATTLE_DURATION() view returns (uint256)",
  "event PlayerEnteredQueue(address indexed player, bool isLong, uint256 queueIndex)",
  "event BattleStarted(uint256 indexed battleId, address indexed longPlayer, address indexed shortPlayer, uint256 startPrice, uint256 startTime)",
  "event BattleResolved(uint256 indexed battleId, address indexed winner, uint256 longStake, uint256 shortStake, uint256 commission)",
] as const;

// Adresse du contrat (à mettre à jour après déploiement)
export const BTCWarfare_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// Constantes
export const MVP_ROOM_STAKE = BigInt("1500000000000000"); // 0.0015 ETH en wei
export const BATTLE_DURATION = 60; // 60 secondes

