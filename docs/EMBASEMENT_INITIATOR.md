# Qui Initie l'Embasement ?

## Réponse Directe

**Actuellement, l'embasement est initié par le FRONTEND uniquement**, via deux mécanismes :

1. **Polling automatique** (après envoi de transaction) → Page Top-up
2. **Vérification manuelle** → Page Balance

Le backend a un mécanisme de scan automatique, mais il est **DÉSACTIVÉ**.

---

## Mécanismes d'Initiation

### 1. Frontend - Polling Automatique (Top-up)

**Fichier :** `app/account/topup/page.tsx`

**Flux :**
```
1. Utilisateur envoie transaction via MetaMask
2. Frontend récupère le txHash
3. Frontend démarre un polling automatique avec setInterval()
4. Polling appelle apiClient.watchTopupTransaction(txHash, currency)
5. API route: POST /api/wallet/watch-topup
6. Backend: depositService.checkTransactionForUser()
7. Backend: depositService.processDepositSecure()
8. ✅ Embasement effectué
```

**Code :**
```typescript
// app/account/topup/page.tsx - ligne 60-66
useEffect(() => {
  if (txHash && (txStatus === "blockchainPending" || txStatus === "metaMaskPending")) {
    const interval = setInterval(() => {
      checkTransactionStatus(); // Appelle watchTopupTransaction()
    }, 10000); // Polling toutes les 10 secondes
    return () => clearInterval(interval);
  }
}, [txHash, txStatus]);
```

**⚠️ Point Important :** Si l'utilisateur ferme la page, le polling s'arrête. Mais l'embasement peut toujours être fait manuellement plus tard.

---

### 2. Frontend - Vérification Manuelle (Balance)

**Fichier :** `app/account/balance/page.tsx`

**Flux :**
```
1. Utilisateur entre manuellement un txHash
2. Utilisateur clique sur "Check"
3. Frontend appelle apiClient.checkDeposit(txHash, currency)
4. API route: POST /api/wallet/check-deposit
5. Backend: depositService.checkTransactionForUser()
6. Backend: depositService.processDepositSecure()
7. ✅ Embasement effectué
```

**Code :**
```typescript
// app/account/balance/page.tsx - ligne 48-71
const handleCheckDeposit = async () => {
  if (!txHash || !selectedCurrency) {
    alert("Please enter transaction hash and select currency");
    return;
  }
  
  setLoading(true);
  try {
    const result = await apiClient.checkDeposit(txHash, selectedCurrency);
    // ... affichage résultat
  } catch (error: any) {
    alert(error.message || "Error checking deposit");
  } finally {
    setLoading(false);
  }
};
```

---

### 3. Backend - Scan Automatique (DÉSACTIVÉ)

**Fichier :** `server/workers/depositMonitor.ts`

**État actuel :**
```typescript
export const startDepositMonitor = (): void => {
  // Worker désactivé - les dépôts sont vérifiés à la demande par les utilisateurs
  console.log('⚠️  Automatic deposit monitor is DISABLED. Users must manually check transactions.');
};
```

**Service disponible mais non utilisé :**
- `depositService.scanDeposits()` existe et pourrait scanner automatiquement la blockchain
- Il est appelé depuis `server/index.ts` ligne 77, mais le worker est vide (juste un log)
- Si activé, il scannerait les derniers 100 blocks toutes les X minutes et embaserait automatiquement

**Pourquoi désactivé ?**
```
DÉSACTIVÉ: Les dépôts sont vérifiés manuellement par les utilisateurs via checkTransactionForUser
pour éviter de surcharger les RPC gratuits avec des scans continus
```

---

## Qui Peut Initier l'Embasement ?

| Initiateur | Mécanisme | Statut | Qui contrôle ? |
|------------|-----------|--------|----------------|
| **Frontend** | Polling automatique (`watchTopupTransaction`) | ✅ **ACTIF** | Utilisateur (polling s'arrête si page fermée) |
| **Frontend** | Vérification manuelle (`checkDeposit`) | ✅ **ACTIF** | Utilisateur (action manuelle) |
| **Backend** | Scan automatique (`scanDeposits`) | ❌ **DÉSACTIVÉ** | Serveur (si activé, automatique) |

---

## Implications de Sécurité

### ✅ Points Positifs

1. **L'utilisateur ne peut pas empêcher l'embasement** :
   - Même si le polling frontend s'arrête, l'utilisateur peut toujours vérifier manuellement
   - Le backend pourrait scanner automatiquement si activé
   - Une transaction confirmée sur la blockchain peut toujours être détectée plus tard

2. **L'utilisateur ne peut pas modifier l'embasement** :
   - Toutes les validations sont côté backend
   - Le montant est toujours récupéré depuis la blockchain
   - Les frais sont calculés serveur

### ⚠️ Points d'Attention

1. **Dépendance au frontend actuellement** :
   - Si l'utilisateur ferme la page avant la fin du polling, l'embasement peut être retardé
   - Solution : Activer le scan automatique backend pour une détection indépendante

2. **Scan automatique désactivé** :
   - Les dépôts doivent être vérifiés manuellement ou via polling frontend
   - Pour une sécurité maximale, activer le worker de scan automatique

---

## Comment Activer le Scan Automatique Backend ?

Si vous voulez que le backend initie automatiquement l'embasement :

1. **Activer le worker dans `server/workers/depositMonitor.ts` :**
```typescript
import cron from 'node-cron';
import depositService from '../services/depositService';

export const startDepositMonitor = (): void => {
  // Scanner toutes les 30 secondes
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await depositService.scanDeposits();
    } catch (error) {
      console.error('Error in deposit monitor:', error);
    }
  });
  
  console.log('✅ Automatic deposit monitor ENABLED. Scanning every 30 seconds.');
};
```

2. **Implications :**
   - Les dépôts seront détectés automatiquement dans les 30 secondes
   - Plus besoin de polling frontend ou vérification manuelle
   - Mais consommation plus importante des appels RPC

---

## Recommandations

### Pour une Sécurité Maximale

1. **Activer le scan automatique backend** :
   - Permet une détection indépendante du frontend
   - L'utilisateur ne peut plus empêcher l'embasement en fermant la page

2. **Garder le polling frontend** :
   - Meilleure UX (feedback immédiat)
   - Mais pas nécessaire pour la sécurité si le backend scanne automatiquement

3. **Garder la vérification manuelle** :
   - Permet à l'utilisateur de forcer une vérification immédiate
   - Utile en cas de problème avec le scan automatique

### Configuration Recommandée

```
✅ Backend scan automatique (toutes les 30-60 secondes)
✅ Frontend polling (pour UX - peut être optionnel)
✅ Frontend vérification manuelle (pour contrôle utilisateur)
```

---

## Résumé

**Actuellement :**
- L'embasement est initié par le **FRONTEND uniquement** (polling ou manuel)
- Le backend **pourrait** initier automatiquement mais c'est désactivé

**Recommandation :**
- Activer le scan automatique backend pour une sécurité maximale
- L'utilisateur ne pourrait alors plus empêcher l'embasement même en fermant la page

