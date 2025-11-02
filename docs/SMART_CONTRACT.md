# Documentation Smart Contract - BTCWarfare

## Vue d'ensemble

Le contrat `BTCWarfare.sol` est le cœur de la plateforme. Il gère les battles P2P entre joueurs qui parient sur la tendance du Bitcoin (Long vs Short).

## Architecture

### Structures de données

#### Room (MVP)
```solidity
struct Room {
    uint256 stakeAmount;                    // Montant de la mise (0.0015 ETH pour MVP)
    uint256 longQueue;                      // Compteur pour queue Long
    uint256 shortQueue;                     // Compteur pour queue Short
    mapping(address => uint256) longWaitingPlayers;    // address => queueIndex
    mapping(address => uint256) shortWaitingPlayers;   // address => queueIndex
    mapping(uint256 => address) longQueueByIndex;      // queueIndex => address
    mapping(uint256 => address) shortQueueByIndex;     // queueIndex => address
}
```

#### Battle
```solidity
struct Battle {
    address longPlayer;      // Joueur qui a parié Long
    address shortPlayer;     // Joueur qui a parié Short
    uint256 startPrice;      // Prix BTC/USD au début (en USD * 10^8)
    uint256 startTime;       // Timestamp de début
    uint256 stakeAmount;     // Mise par joueur
    bool resolved;           // Si la battle est résolue
    address winner;          // Adresse du gagnant
}
```

## Fonctions principales

### `enterRoom(bool isLong)`

Permet à un joueur d'entrer dans la file d'attente pour une battle.

**Paramètres:**
- `isLong`: `true` pour Long, `false` pour Short

**Requis:**
- Mise exacte de `0.0015 ETH` (MVP_ROOM_STAKE)
- Le joueur ne doit pas être déjà dans une queue

**Comportement:**
1. Vérifie le montant de la mise
2. Ajoute le joueur à la queue appropriée (Long ou Short)
3. Si un adversaire opposé est disponible, déclenche automatiquement `_matchPlayers()`
4. Émet l'event `PlayerEnteredQueue` ou `BattleStarted`

**Exemple:**
```solidity
// Joueur entre en Long avec 0.0015 ETH
await btcWarfare.enterRoom(true, { value: ethers.parseEther("0.0015") });
```

### `_matchPlayers()` (interne)

Matche deux joueurs (un Long et un Short) et crée une battle.

**Algorithme FIFO:**
- Prend le premier joueur Long disponible
- Prend le premier joueur Short disponible
- Les retire des queues respectives
- Crée une nouvelle battle avec:
  - Prix BTC/USD actuel depuis Chainlink
  - Timestamp de début
  - Les deux joueurs

**Émet:**
- `BattleStarted(battleId, longPlayer, shortPlayer, startPrice, startTime)`

### `resolveBattle(uint256 battleId)`

Résout une battle après 60 secondes et distribue les gains.

**Requis:**
- La battle doit exister
- `block.timestamp >= battle.startTime + 60 secondes`
- La battle ne doit pas être déjà résolue

**Logique de résolution:**
1. Récupère le prix BTC/USD actuel depuis Chainlink
2. Compare avec le prix de départ:
   - **Prix monté** → Long gagne
   - **Prix descendu** → Short gagne
   - **Prix égal** → Long gagne par défaut
3. Calcule les montants:
   - Total mise = `stakeAmount * 2`
   - Commission = `totalStake * 5%`
   - Gains gagnant = `totalStake - commission`
4. Distribue les gains au gagnant
5. Transfère la commission au owner (plateforme)
6. Marque la battle comme résolue

**Émet:**
- `BattleResolved(battleId, winner, longStake, shortStake, commission)`

**Exemple:**
```solidity
// Après 60 secondes
await btcWarfare.resolveBattle(1);
```

### `leaveQueue(bool isLong)`

Permet à un joueur de quitter la file d'attente et récupère son remboursement.

**Requis:**
- Le joueur doit être dans la queue appropriée

**Comportement:**
1. Retire le joueur de la queue
2. Remmbourse la mise (`0.0015 ETH`)

### Fonctions view

#### `getBattle(uint256 battleId)`
Retourne toutes les informations d'une battle.

#### `getPlayerBattles(address player)`
Retourne la liste des battleIds d'un joueur.

#### `isInQueue(address player, bool isLong)`
Vérifie si un joueur est dans une queue.

#### `getCurrentBTCPrice()`
Retourne le prix BTC/USD actuel depuis Chainlink (en USD * 10^8).

## Intégration Chainlink

Le contrat utilise Chainlink Price Feeds pour obtenir le prix BTC/USD.

### Réseaux supportés

- **Polygon Mumbai**: Mock Aggregator pour tests
- **Arbitrum Sepolia**: BTC/USD Price Feed

### Adresses Price Feed

```javascript
const priceFeedAddresses = {
  mumbai: "0x007A22900a3B98143368Bd5906f8E17e9867581b",
  arbitrumSepolia: "0x6ce185860a4963106506C203335A2910413708e9",
};
```

### Format des prix

Les prix sont retournés en **8 décimales**:
- Prix BTC = $50000 → `50000 * 10^8` = `5000000000000`

## Sécurité

### ReentrancyGuard
Toutes les fonctions qui distribuent des fonds utilisent `nonReentrant` pour prévenir les attaques de réentrance.

### Checks-Effects-Interactions
Le contrat suit le pattern CEI:
1. **Checks**: Validation des conditions
2. **Effects**: Mise à jour de l'état
3. **Interactions**: Transferts de fonds

### Ownership
- Seul le `owner` peut mettre à jour le Price Feed
- La commission est versée au `owner`

## Événements

### `PlayerEnteredQueue`
```solidity
event PlayerEnteredQueue(address indexed player, bool isLong, uint256 queueIndex);
```

### `BattleStarted`
```solidity
event BattleStarted(
    uint256 indexed battleId,
    address indexed longPlayer,
    address indexed shortPlayer,
    uint256 startPrice,
    uint256 startTime
);
```

### `BattleResolved`
```solidity
event BattleResolved(
    uint256 indexed battleId,
    address indexed winner,
    uint256 longStake,
    uint256 shortStake,
    uint256 commission
);
```

## Constantes

```solidity
uint8 public constant COMMISSION_RATE = 5;           // 5%
uint256 public constant BATTLE_DURATION = 60;        // 60 secondes
uint256 public constant MVP_ROOM_STAKE = 0.0015 ether; // 0.0015 ETH
```

## Tests

Le contrat est testé avec:
- Matching FIFO
- Résolution correcte (Long/Short)
- Distribution des gains
- Commission plateforme
- Gestion des queues
- Remmboursements

Voir `test/BTCWarfare.test.js` pour les détails.

## Déploiement

```bash
# Sur Polygon Mumbai
npm run deploy:mumbai

# Sur Arbitrum Sepolia
hardhat run scripts/deploy.js --network arbitrumSepolia
```

Le script de déploiement:
1. Déploie le contrat avec l'adresse du Price Feed
2. Attend les confirmations
3. Vérifie le contrat sur Etherscan (si API key disponible)

