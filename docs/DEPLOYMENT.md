# Guide de Déploiement - BTCWarfare

Ce guide explique comment déployer les smart contracts et le frontend de BTCWarfare.

## Prérequis

- Node.js 18+ et npm/pnpm/yarn
- Wallet MetaMask avec des fonds de test (pour testnet)
- Compte PolygonScan/Arbiscan (optionnel, pour la vérification)

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Wallet Private Key (NE JAMAIS COMMITER)
PRIVATE_KEY=your_private_key_here

# RPC URLs
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# API Keys pour vérification (optionnel)
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# Frontend
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (à remplir après déploiement)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id (optionnel)
```

**⚠️ Important :** Ne jamais commiter le fichier `.env` avec une vraie clé privée !

## Déploiement des Smart Contracts

### 1. Installation des dépendances

```bash
npm install
```

### 2. Compilation des contrats

```bash
npm run compile
```

Cela compile les contrats Solidity et génère les ABIs dans `artifacts/`.

### 3. Tests (recommandé)

```bash
npm test
```

Les tests vérifient :
- Le matching FIFO
- La résolution des battles
- La distribution des gains
- La commission plateforme

### 4. Déploiement sur Polygon Mumbai (testnet)

```bash
npm run deploy:mumbai
```

Ou manuellement :

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Le script va :
1. Déployer le contrat BTCWarfare avec l'adresse du Price Feed Chainlink
2. Afficher l'adresse du contrat déployé
3. Attendre les confirmations
4. (Optionnel) Vérifier le contrat sur PolygonScan si `POLYGONSCAN_API_KEY` est configuré

### 5. Déploiement sur Arbitrum Sepolia (testnet alternatif)

```bash
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

### 6. Vérification du contrat

Si vous avez configuré l'API key, le script essaie automatiquement de vérifier le contrat. Sinon :

```bash
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <PRICE_FEED_ADDRESS>
```

### 7. Adresses des Price Feeds Chainlink

#### Polygon Mumbai (testnet)
- Mock Aggregator: `0x007A22900a3B98143368Bd5906f8E17e9867581b`
- Note: Utiliser un mock price feed pour les tests

#### Arbitrum Sepolia (testnet)
- BTC/USD: `0x6ce185860a4963106506C203335A2910413708e9`

#### Polygon Mainnet (production)
- BTC/USD: `0xc907E116054Ad103354f2D350FD2514433D67F31`

#### Arbitrum Mainnet (production)
- BTC/USD: `0x6ce185860a4963106506C203335A2910413708e9`

## Configuration du Frontend

### 1. Mettre à jour l'adresse du contrat

Après avoir déployé le contrat, mettez à jour `.env` :

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Adresse du contrat déployé
```

### 2. Mettre à jour l'ABI (optionnel)

L'ABI est déjà inclus dans `lib/contracts.ts`. Si vous avez modifié le contrat, copiez l'ABI depuis `artifacts/contracts/BTCWarfare.sol/BTCWarfare.json`.

### 3. Installation des dépendances frontend

```bash
npm install
```

### 4. Build du frontend

```bash
npm run build
```

### 5. Démarrage en production

```bash
npm start
```

### 6. Développement local

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`.

## Déploiement du Frontend

### Vercel (recommandé)

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel :
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optionnel)
3. Déployez !

### Autres plateformes

Le frontend Next.js peut être déployé sur :
- Vercel (recommandé)
- Netlify
- AWS Amplify
- Railway
- Votre propre serveur

## Vérification post-déploiement

### Smart Contract

1. Vérifiez sur PolygonScan/Arbiscan :
   - Contrat vérifié ✓
   - Fonctions disponibles
   - Events émis

2. Testez les fonctions :
   - `enterRoom(true)` avec 0.0015 ETH
   - Vérifiez qu'un match se produit
   - Résolvez une battle après 60 secondes

### Frontend

1. Connectez votre wallet
2. Sélectionnez Long ou Short
3. Vérifiez que la transaction passe
4. Attendez le matching
5. Vérifiez que la battle démarre
6. Attendez 60 secondes
7. Résolvez la battle
8. Vérifiez la distribution des gains

## Troubleshooting

### Le contrat ne se déploie pas

- Vérifiez que vous avez des fonds de test sur le réseau
- Vérifiez que le RPC URL est correct
- Vérifiez que la clé privée est correcte

### Le frontend ne se connecte pas au contrat

- Vérifiez que `NEXT_PUBLIC_CONTRACT_ADDRESS` est correct
- Vérifiez que vous êtes sur le bon réseau (Polygon Mumbai)
- Vérifiez que le wallet est connecté au bon réseau

### Les transactions échouent

- Vérifiez que vous avez assez de gas
- Vérifiez que la mise est exactement 0.0015 ETH
- Vérifiez que vous n'êtes pas déjà dans une queue

## Migration vers Mainnet

Quand vous êtes prêt pour la production :

1. Déployez le contrat sur Polygon Mainnet ou Arbitrum Mainnet
2. Utilisez le vrai Price Feed Chainlink (adresses ci-dessus)
3. Mettez à jour les variables d'environnement frontend
4. Déployez le frontend avec la nouvelle adresse du contrat
5. Testez minutieusement avant de lancer publiquement

**⚠️ Important :** Toujours tester sur testnet avant de déployer sur mainnet !

