# Documentation Architecture - BTCWarfare

## Vue d'ensemble

BTCWarfare est une plateforme de battle P2P pour parier sur la tendance du Bitcoin (Long vs Short). Les utilisateurs s'affrontent dans des battles de 60 secondes, où le gagnant remporte 95% de la mise (5% de commission pour la plateforme).

## Stack Technique

### Frontend

- **Next.js 16** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling avec utilities glassmorphic personnalisées
- **Framer Motion** : Animations et transitions
- **wagmi v2** : Bibliothèque Web3 React
- **viem** : Client Ethereum type-safe

### Smart Contracts

- **Solidity 0.8.24** : Langage de programmation
- **Hardhat** : Framework de développement et déploiement
- **Chainlink Price Feeds** : Oracle pour les prix BTC/USD
- **OpenZeppelin** : Bibliothèque de contrats sécurisés

### Blockchain

- **Polygon Mumbai** : Testnet pour le MVP
- **Arbitrum Sepolia** : Alternative testnet

## Architecture Frontend

### Structure des dossiers

```
app/
├── layout.tsx          # Layout principal (Server Component)
├── providers.tsx        # Providers client (Web3Provider)
├── page.tsx             # Landing page glassmorphic
├── battle/
│   └── page.tsx         # Interface de battle (à développer)
└── globals.css          # Styles globaux avec glassmorphism

components/
├── Web3Provider.tsx     # Provider wagmi + React Query
└── WalletConnect.tsx    # Composant de connexion wallet

lib/
├── wagmi.ts            # Configuration wagmi
└── utils.ts            # Fonctions utilitaires

hooks/
├── useBattle.ts        # Hook pour logique de battle (à développer)
└── useContract.ts      # Hook pour interaction contrat (à développer)
```

### Flux de données

1. **Connexion Wallet** : L'utilisateur se connecte via MetaMask ou WalletConnect
2. **Sélection Room** : Choix de la room (MVP: 0.0015 ETH uniquement)
3. **Sélection Position** : Long ou Short
4. **Matching** : Le smart contract match automatiquement avec un adversaire opposé
5. **Battle** : Cycle de 60 secondes avec prix figé au début
6. **Résolution** : Détermination du gagnant basée sur la tendance après 60s
7. **Distribution** : Le gagnant reçoit 95% de la mise totale

## Design System

### Glassmorphism

- Backgrounds semi-transparents avec `backdrop-filter: blur()`
- Borders subtils pour effet de profondeur
- Multi-layer pour effets visuels riches

### Couleurs Néon

- **Cyan** (`#00ffff`) : Couleur principale
- **Pink** (`#ff00ff`) : Accents
- **Purple** (`#9d4edd`) : Variations
- **Blue** (`#4361ee`) : Tertiaire

### Animations

- Gradient animé en arrière-plan
- Effets de glow pulsants
- Transitions fluides avec Framer Motion

## Sécurité

### Frontend

- Validation des entrées utilisateur
- Gestion des erreurs de transactions
- Timeout et retry pour les appels réseau

### Smart Contracts (à implémenter)

- ReentrancyGuard pour les distributions
- Checks-Effects-Interactions pattern
- Validation des montants de mise
- Protection contre les attaques de front-running

## Prochaines étapes

1. ✅ Setup projet et landing page
2. 🚧 Développement du smart contract BTCWarfare
3. 🚧 Tests unitaires du contrat
4. 🚧 Interface de battle complète
5. 🚧 Documentation complète
