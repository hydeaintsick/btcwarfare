# BTCWarfare - Battle P2P Crypto

Plateforme de battle P2P pour parier sur le Bitcoin (Long vs Short). Affrontez d'autres joueurs dans des battles de 60 secondes où le gagnant remporte 95% de la mise.

## 🚀 Démarrage Rapide

### Backend

1. Créer le fichier `.env` à la racine (voir `.env.example`)
2. Installer les dépendances : `npm install`
3. Démarrer le serveur : `npm run dev:server`

### Frontend

1. Démarrer Next.js : `npm run dev`
2. Ouvrir http://localhost:3000

## 🎮 Fonctionnalités

- ✅ **Backend API** avec Node.js/Express et MongoDB
- ✅ **Authentification par wallet** (signature message)
- ✅ **Top-up en ETH et USDT** avec frais de 10%
- ✅ **Matching automatique** Long/Short
- ✅ **Résolution automatique** des battles après 60 secondes
- ✅ **API prix BTC** avec CoinGecko et Binance fallback
- ✅ **Interface de battle** complète

## 🚀 Stack Technique

**Backend:**

- Node.js/Express
- TypeScript
- MongoDB (Mongoose)
- ethers.js (pour vérification signatures et monitoring blockchain)
- node-cron (jobs automatiques)

**Frontend:**

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion

## 📦 Installation

```bash
# Installer les dépendances
npm install
```

## ⚙️ Configuration

1. Créer un fichier `.env` à la racine :

```bash
# Backend API
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT Secret (changez en production)
JWT_SECRET=your-secret-jwt-key

# Blockchain RPC URLs (pour monitoring dépôts)
RPC_URL=https://eth.llamarpc.com
ETH_RPC_URL=https://eth.llamarpc.com

# Platform Wallet Private Key (pour recevoir les dépôts)
PLATFORM_PRIVATE_KEY=your_platform_wallet_private_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🛠️ Développement

### Backend

```bash
# Démarrer le serveur en mode développement (avec nodemon)
npm run dev:server

# Démarrer le serveur
npm run server
```

### Frontend

```bash
# Démarrer Next.js
npm run dev

# Build production
npm run build

# Démarrer en production
npm start
```

## 📁 Structure du Projet

```
btcwarfare/
├── server/                    # Backend API
│   ├── config/               # Configuration (DB, etc.)
│   ├── models/               # Modèles MongoDB
│   ├── routes/               # Routes API
│   ├── services/             # Services métier
│   ├── middleware/           # Middleware (auth, etc.)
│   ├── utils/                # Utilitaires
│   └── workers/              # Workers (cron jobs)
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Landing page
│   └── battle/
│       └── page.tsx          # Interface de battle
├── components/               # Composants React
│   ├── WalletConnect.tsx    # Connexion wallet
│   └── Countdown.tsx        # Compte à rebours
├── hooks/                    # Hooks personnalisés
│   ├── useWallet.ts         # Hook wallet/auth
│   └── useAPI.ts            # Hooks API
└── lib/                     # Utilitaires
    ├── api.ts               # Client API
    └── utils.ts             # Fonctions utilitaires
```

## 🎯 Comment ça fonctionne

1. **Connexion**: Connectez votre wallet (MetaMask) et signez un message
2. **Top-up**: Dépôts en ETH ou USDT (10% de frais de plateforme)
3. **Sélection**: Choisissez Long (prix monte) ou Short (prix descend)
4. **Mise**: 0.0015 ETH ou équivalent USDT est débité
5. **Matching**: Le système match automatiquement avec un adversaire opposé
6. **Battle**: 60 secondes avec prix figé au début
7. **Résolution**: Le gagnant est déterminé automatiquement après 60 secondes
8. **Distribution**: 95% de la mise totale va au gagnant (5% commission)

## 💰 Système de Top-up

- Les utilisateurs peuvent déposer **ETH** ou **USDT** sur une adresse de la plateforme
- **10% de frais** sont prélevés automatiquement sur chaque dépôt
- Le backend détecte les dépôts on-chain et crédite le compte utilisateur
- Les transactions sont enregistrées pour la comptabilité

## 🔒 Sécurité

- Authentification par signature (challenge/verify)
- JWT pour les sessions
- Validation des transactions on-chain
- Protection CORS
- Validation des montants et entrées

## 📝 License

MIT
