# Documentation Frontend - BTCWarfare

## Vue d'ensemble

Le frontend BTCWarfare est construit avec Next.js 16, React 19, TypeScript, Tailwind CSS et wagmi pour l'intégration Web3.

## Architecture

### Structure des fichiers

```
app/
├── layout.tsx          # Layout principal (Server Component)
├── providers.tsx       # Providers client (Web3Provider)
├── page.tsx            # Landing page glassmorphic
├── battle/
│   └── page.tsx        # Interface de battle
└── globals.css         # Styles globaux

components/
├── Web3Provider.tsx    # Provider wagmi + React Query
├── WalletConnect.tsx   # Composant de connexion wallet
├── Countdown.tsx       # Compte à rebours 60 secondes
├── BattleCard.tsx      # Carte d'affichage de battle
└── BattleCardWrapper.tsx # Wrapper pour charger les données

hooks/
├── useContract.ts      # Hooks pour interagir avec le contrat

lib/
├── wagmi.ts            # Configuration wagmi
├── contracts.ts        # ABI et adresse du contrat
└── utils.ts           # Fonctions utilitaires
```

## Composants principaux

### `WalletConnect`

Composant pour connecter/déconnecter le wallet.

**Fonctionnalités:**
- Connexion via MetaMask ou WalletConnect
- Affichage de l'adresse formatée
- Indicateur de statut de connexion
- Déconnexion

**Usage:**
```tsx
<WalletConnect />
```

### `Countdown`

Composant de compte à rebours pour les battles.

**Props:**
- `startTime`: Timestamp de début (bigint)
- `duration`: Durée en secondes (60)
- `onComplete`: Callback quand le temps est écoulé

**Usage:**
```tsx
<Countdown
  startTime={battle.startTime}
  duration={60}
  onComplete={() => handleResolveBattle()}
/>
```

### `BattleCard`

Carte d'affichage d'une battle avec toutes les informations.

**Props:**
- `battleId`: ID de la battle
- `longPlayer`: Adresse du joueur Long
- `shortPlayer`: Adresse du joueur Short
- `startPrice`: Prix de départ
- `startTime`: Timestamp de début
- `currentPrice`: Prix actuel (optionnel)
- `stakeAmount`: Montant de la mise
- `resolved`: Si la battle est résolue
- `winner`: Adresse du gagnant (optionnel)
- `onResolve`: Fonction pour résoudre la battle

**Usage:**
```tsx
<BattleCard
  battleId={battleId}
  longPlayer={longPlayer}
  shortPlayer={shortPlayer}
  startPrice={startPrice}
  startTime={startTime}
  currentPrice={currentPrice}
  stakeAmount={stakeAmount}
  resolved={resolved}
  winner={winner}
  onResolve={handleResolveBattle}
/>
```

## Hooks personnalisés

### `useBTCWarfare()`

Hook principal pour interagir avec le contrat.

**Fonctions:**
- `enterRoom(isLong)`: Entrer dans une room
- `resolveBattle(battleId)`: Résoudre une battle
- `leaveQueue(isLong)`: Quitter la queue

**Retourne:**
- `hash`: Hash de la transaction
- `isPending`: Si la transaction est en attente
- `isConfirming`: Si la transaction est en confirmation
- `isConfirmed`: Si la transaction est confirmée
- `error`: Erreur éventuelle

**Usage:**
```tsx
const { enterRoom, resolveBattle, isPending, error } = useBTCWarfare();

await enterRoom(true); // Entrer en Long
```

### `useBattle(battleId)`

Hook pour récupérer les données d'une battle.

**Retourne:**
- `battle`: Données de la battle
- `isLoading`: Si en chargement
- `error`: Erreur éventuelle

**Usage:**
```tsx
const { battle, isLoading } = useBattle(battleId);
```

### `usePlayerBattles(address)`

Hook pour récupérer les battles d'un joueur.

**Retourne:**
- `battleIds`: Array des IDs de battles
- `isLoading`: Si en chargement
- `error`: Erreur éventuelle

**Usage:**
```tsx
const { battleIds } = usePlayerBattles(address);
```

### `useIsInQueue(address, isLong)`

Hook pour vérifier si un joueur est dans une queue.

**Retourne:**
- `inQueue`: Boolean
- `isLoading`: Si en chargement
- `error`: Erreur éventuelle

**Usage:**
```tsx
const { inQueue } = useIsInQueue(address, true);
```

### `useCurrentBTCPrice()`

Hook pour récupérer le prix BTC/USD actuel.

**Retourne:**
- `price`: Prix en bigint (8 décimales)
- `priceUSD`: Prix en USD (number)
- `isLoading`: Si en chargement
- `error`: Erreur éventuelle

**Usage:**
```tsx
const { priceUSD } = useCurrentBTCPrice();
```

## Pages

### Landing Page (`app/page.tsx`)

Page d'accueil avec :
- Présentation des 3 rooms (MVP: seulement 0.0015 ETH actif)
- Instructions "Comment ça fonctionne"
- Connexion wallet
- Call-to-action vers la battle

### Battle Page (`app/battle/page.tsx`)

Interface principale de battle avec :
- Sélection Long/Short
- Affichage du prix BTC actuel
- Matching en temps réel
- Countdown 60 secondes
- Affichage des résultats
- Historique des battles

## Design System

### Couleurs Néon

- **Cyan** (`#00ffff`): Couleur principale
- **Pink** (`#ff00ff`): Accents
- **Purple** (`#9d4edd`): Variations
- **Blue** (`#4361ee`): Tertiaire

### Glassmorphism

Classes utilitaires dans `globals.css`:
- `.glass`: Fond semi-transparent avec blur
- `.glass-strong`: Version plus opaque
- `.neon-text`: Effet de texte néon
- `.glow-cyan`: Effet de glow cyan

### Animations

- `animate-pulse-neon`: Pulsation néon
- `animated-gradient`: Dégradé animé en arrière-plan
- Animations Framer Motion pour les transitions

## Gestion des erreurs

### Transactions

Les erreurs de transaction sont capturées et affichées à l'utilisateur :

```tsx
try {
  await enterRoom(true);
} catch (error: any) {
  console.error("Error:", error);
  alert(error?.message || "Erreur lors de l'entrée dans la room");
}
```

### Connexion Wallet

Le composant `WalletConnect` gère les erreurs de connexion automatiquement.

### Chargement des données

Tous les hooks retournent `isLoading` pour afficher des états de chargement.

## Optimisations

### Rafraîchissement automatique

Les hooks utilisent `refetchInterval` pour rafraîchir les données :
- Battle: toutes les 2 secondes
- Player battles: toutes les 3 secondes
- Prix BTC: toutes les 5 secondes

### Performance

- Composants client-side seulement quand nécessaire
- Lazy loading des composants lourds
- Optimisation des re-renders avec React Query

## Configuration

### Variables d'environnement

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Adresse du contrat
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=... # Optionnel
```

### Réseaux supportés

- Polygon Mumbai (testnet)
- Arbitrum Sepolia (testnet)

Configuration dans `lib/wagmi.ts`.

## Développement

### Démarrage local

```bash
npm run dev
```

### Build production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Prochaines améliorations

- [ ] Notifications push pour les events de battle
- [ ] Graphique de prix en temps réel
- [ ] Statistiques des battles
- [ ] Leaderboard
- [ ] Historique détaillé avec graphiques
- [ ] Mode sombre/clair
- [ ] Internationalisation (i18n)

