# Guide de Migration vers Mainnet - BTCWarfare

Guide pour passer de testnet à mainnet quand vous serez prêt à lancer en production.

## ⚠️ Prérequis avant de migrer

1. **Tests complets sur testnet** : Vérifier que tout fonctionne parfaitement
2. **Audit de sécurité** : Faire auditer le contrat par des experts (recommandé)
3. **Fonds suffisants** : Avoir assez de gas pour le déploiement
4. **Plan de rollback** : Avoir un plan en cas de problème

## 🔄 Étapes de migration

### 1. Mettre à jour Hardhat Config

Ajoutez les réseaux mainnet dans `hardhat.config.js` :

```javascript
networks: {
  // ... réseaux testnet existants ...
  
  polygon: {
    url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 137,
  },
  arbitrum: {
    url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 42161,
  },
},
etherscan: {
  apiKey: {
    polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
    polygon: process.env.POLYGONSCAN_API_KEY || "", // Mainnet
    arbitrumOne: process.env.ARBISCAN_API_KEY || "", // Mainnet
  },
},
```

### 2. Mettre à jour les Price Feeds Chainlink

Dans `scripts/deploy.js`, ajoutez les adresses mainnet :

```javascript
const priceFeedAddresses = {
  mumbai: "0x007A22900a3B98143368Bd5906f8E17e9867581b", // Testnet
  arbitrumSepolia: "0x6ce185860a4963106506C203335A2910413708e9", // Testnet
  polygon: "0xc907E116054Ad103354f2D350FD2514433D67F31", // Mainnet BTC/USD
  arbitrum: "0x6ce185860a4963106506C203335A2910413708e9", // Mainnet BTC/USD
};
```

### 3. Mettre à jour wagmi Config

Dans `lib/wagmi.ts`, ajoutez les chaînes mainnet :

```typescript
import { polygon, arbitrum } from "wagmi/chains";

export const config = createConfig({
  chains: [
    polygonMumbai, // Garder testnet pour dev
    arbitrumSepolia, // Garder testnet pour dev
    polygon, // Mainnet
    arbitrum, // Mainnet
  ],
  // ...
});
```

### 4. Mettre à jour les variables d'environnement

Dans `.env`, ajoutez les RPC mainnet :

```bash
# Testnet (garder pour dev)
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc

# Mainnet
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# API Keys (même pour mainnet et testnet)
POLYGONSCAN_API_KEY=your_key
ARBISCAN_API_KEY=your_key
```

### 5. Déploiement sur Mainnet

```bash
# Sur Polygon Mainnet
npx hardhat run scripts/deploy.js --network polygon

# Sur Arbitrum Mainnet
npx hardhat run scripts/deploy.js --network arbitrum
```

### 6. Mettre à jour le Frontend

Après déploiement, mettez à jour `.env` :

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Nouvelle adresse mainnet
```

Et mettez à jour `lib/contracts.ts` avec la nouvelle adresse.

### 7. Vérification sur Explorer

- Vérifiez le contrat sur [PolygonScan](https://polygonscan.com) ou [Arbiscan](https://arbiscan.io)
- Vérifiez que toutes les fonctions sont accessibles
- Vérifiez que les events sont émis correctement

## 📋 Checklist avant le lancement

- [ ] Contrat déployé et vérifié sur mainnet
- [ ] Tous les tests passent sur mainnet
- [ ] Prix Feed Chainlink fonctionne correctement
- [ ] Frontend connecté au bon réseau
- [ ] Variables d'environnement mises à jour
- [ ] Tests de bout en bout effectués sur mainnet
- [ ] Documentation mise à jour
- [ ] Plan de monitoring mis en place
- [ ] Plan de rollback préparé

## 🚨 Sécurité Mainnet

### Avant le lancement

1. **Audit de sécurité** : Faire auditer le contrat (recommandé fortement)
2. **Tests de charge** : Tester avec plusieurs transactions simultanées
3. **Limites de gas** : Vérifier que les limites de gas sont suffisantes
4. **Ownership** : S'assurer que le owner peut mettre à jour le Price Feed si nécessaire

### Pendant le lancement

1. **Monitoring** : Surveiller les transactions et events
2. **Gas prices** : Surveiller les prix du gas
3. **Errors** : Surveiller les erreurs dans le frontend
4. **User feedback** : Recueillir les retours utilisateurs

### Après le lancement

1. **Analytics** : Suivre l'utilisation et les métriques
2. **Bugs** : Corriger rapidement les bugs trouvés
3. **Optimizations** : Optimiser le gas usage si nécessaire
4. **Updates** : Mettre à jour le contrat si nécessaire (avec prudence)

## 🔍 Adresses Chainlink Price Feeds Mainnet

### Polygon Mainnet
- **BTC/USD**: `0xc907E116054Ad103354f2D350FD2514433D67F31`
- [Documentation](https://docs.chain.link/data-feeds/price-feeds/addresses)

### Arbitrum Mainnet
- **BTC/USD**: `0x6ce185860a4963106506C203335A2910413708e9`
- [Documentation](https://docs.chain.link/data-feeds/price-feeds/addresses)

## 💰 Coûts de déploiement (estimations)

### Polygon Mainnet
- Déploiement contrat: ~0.1-0.5 MATIC (très bon marché)
- Prix Feed: Gratuit (déjà déployé par Chainlink)

### Arbitrum Mainnet
- Déploiement contrat: ~0.01-0.05 ETH (bon marché)
- Prix Feed: Gratuit (déjà déployé par Chainlink)

## 📞 Support

En cas de problème lors de la migration :
1. Vérifiez les logs de déploiement
2. Vérifiez que le wallet a assez de fonds
3. Vérifiez que les RPC URLs sont correctes
4. Vérifiez que les adresses de Price Feed sont correctes

## ✅ Résumé

**Actuellement** : Configuration pour **TESTNET** (Polygon Mumbai + Arbitrum Sepolia)

**Pour passer en mainnet** :
1. Ajouter les réseaux mainnet dans Hardhat
2. Ajouter les chaînes mainnet dans wagmi
3. Mettre à jour les adresses de Price Feed
4. Déployer le contrat sur mainnet
5. Mettre à jour les variables d'environnement frontend
6. Tester minutieusement avant de lancer publiquement

⚠️ **Ne jamais déployer en mainnet sans tests complets sur testnet !**

