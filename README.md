# BTCWarfare - Battle P2P Crypto

Plateforme de battle P2P pour parier sur le Bitcoin (Long vs Short). Affrontez d'autres joueurs dans des battles de 60 secondes où le gagnant remporte 95% de la mise.

## 🎮 Fonctionnalités MVP

- ✅ **Landing page glassmorphic** avec design futuriste et effets néon
- ✅ **Smart contract BTCWarfare** avec matching FIFO automatique
- ✅ **Interface de battle** complète avec sélection Long/Short
- ✅ **Countdown 60 secondes** en temps réel
- ✅ **Matching automatique** entre joueurs opposés
- ✅ **Intégration Chainlink** pour prix BTC/USD en temps réel
- ✅ **Distribution automatique** des gains (95% au gagnant, 5% commission)
- ✅ **Tests unitaires** complets pour le contrat

## 🚀 Stack Technique

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Web3**: wagmi v2, viem
- **Smart Contracts**: Solidity 0.8.24, Hardhat
- **Oracle**: Chainlink Price Feeds (BTC/USD)
- **Blockchain**: Polygon Mumbai testnet (MVP)
- **Sécurité**: OpenZeppelin (ReentrancyGuard, Ownable)

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Ou avec yarn
yarn install

# Ou avec pnpm
pnpm install
```

## ⚙️ Configuration

1. Créez un fichier `.env` à la racine :
```bash
# Wallet Private Key (NE JAMAIS COMMITER)
PRIVATE_KEY=your_private_key_here

# RPC URLs
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# API Keys (optionnel pour vérification)
POLYGONSCAN_API_KEY=your_key
ARBISCAN_API_KEY=your_key

# Frontend
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # À remplir après déploiement
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id # Optionnel
```

## 🛠️ Développement

### Frontend

```bash
# Démarrer le serveur de développement
npm run dev

# Build production
npm run build

# Démarrer en production
npm start
```

### Smart Contracts

```bash
# Compiler les contrats
npm run compile

# Lancer les tests
npm test

# Déployer sur Polygon Mumbai
npm run deploy:mumbai

# Déployer sur Arbitrum Sepolia
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

## 📁 Structure du Projet

```
btcwarfare/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Landing page
│   └── battle/
│       └── page.tsx         # Interface de battle
├── components/               # Composants React
│   ├── WalletConnect.tsx    # Connexion wallet
│   ├── Countdown.tsx        # Compte à rebours
│   ├── BattleCard.tsx       # Carte de battle
│   └── Web3Provider.tsx    # Provider Web3
├── hooks/                    # Hooks personnalisés
│   └── useContract.ts       # Hooks pour contrat
├── lib/                     # Utilitaires
│   ├── wagmi.ts             # Configuration wagmi
│   ├── contracts.ts         # ABI et adresse contrat
│   └── utils.ts             # Fonctions utilitaires
├── contracts/               # Smart contracts Solidity
│   ├── BTCWarfare.sol       # Contrat principal
│   ├── interfaces/         # Interfaces
│   └── mocks/               # Mocks pour tests
├── scripts/                 # Scripts Hardhat
│   └── deploy.js            # Script de déploiement
├── test/                    # Tests unitaires
│   └── BTCWarfare.test.js   # Tests du contrat
└── docs/                    # Documentation
    ├── ARCHITECTURE.md      # Architecture du système
    ├── SMART_CONTRACT.md    # Documentation contrat
    ├── DEPLOYMENT.md        # Guide de déploiement
    └── FRONTEND.md          # Documentation frontend
```

## 📚 Documentation

Documentation complète disponible dans le dossier `docs/`:

- [Architecture](./docs/ARCHITECTURE.md) - Vue d'ensemble du système
- [Smart Contract](./docs/SMART_CONTRACT.md) - Documentation détaillée du contrat
- [Déploiement](./docs/DEPLOYMENT.md) - Guide de déploiement
- [Frontend](./docs/FRONTEND.md) - Documentation frontend

## 🎯 Comment ça fonctionne

1. **Connexion**: Connectez votre wallet (MetaMask, WalletConnect)
2. **Sélection**: Choisissez Long (prix monte) ou Short (prix descend)
3. **Mise**: Payez 0.0015 ETH pour entrer dans la room
4. **Matching**: Le système match automatiquement avec un adversaire opposé
5. **Battle**: 60 secondes avec prix figé au début
6. **Résolution**: Le gagnant est déterminé après 60 secondes
7. **Distribution**: 95% de la mise totale va au gagnant (5% commission)

## 🔒 Sécurité

- **ReentrancyGuard**: Protection contre les attaques de réentrance
- **Checks-Effects-Interactions**: Pattern CEI pour sécurité
- **Ownership**: Seul le owner peut mettre à jour le Price Feed
- **Validation**: Validation stricte des montants et entrées

## 🧪 Tests

Les tests couvrent :
- Matching FIFO
- Résolution des battles (Long/Short)
- Distribution des gains
- Commission plateforme
- Gestion des queues

```bash
npm test
```

## 📝 License

MIT

## 🙏 Remerciements

- Chainlink pour les Price Feeds
- OpenZeppelin pour les contrats sécurisés
- wagmi/viem pour l'intégration Web3

