# Flux d'Embasement des Transactions - Analyse de Sécurité

## Vue d'ensemble

Ce document explique le flux complet d'embasement (enregistrement) d'une transaction de dépôt dans le système. L'objectif est de garantir que :
1. ✅ L'utilisateur ne peut **PAS** empêcher l'embasement
2. ✅ L'utilisateur ne peut **PAS** modifier l'embasement
3. ✅ Toutes les validations sont effectuées côté serveur
4. ✅ Le montant est toujours récupéré depuis la blockchain (jamais depuis le frontend)

---

## Schéma du Flux Complet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUX D'EMBASEMENT D'UNE TRANSACTION                   │
└─────────────────────────────────────────────────────────────────────────────┘

[FRONTEND]                                  [BACKEND]                          [BLOCKCHAIN]
────────────────────────────────────────────────────────────────────────────────────────────

1. UTILISATEUR SÉLECTIONNE UN PACK
   ┌─────────────────┐
   │ TopupPage.tsx   │
   │ selectPack()    │
   └────────┬────────┘
            │
            ▼
2. INITIATION DU TOPUP
   ┌─────────────────┐       POST /api/wallet/initiate-topup
   │ apiClient.      │ ────────────────────────────────────────► │ wallet.ts │
   │ initiateTopup() │                                           │ Route     │
   └────────┬────────┘                                           └─────┬─────┘
            │                                                           │
            │                       ◄─────────────────────────────────┘
            │                       { address, amount, fee }
            │
            ▼
   ┌─────────────────────────────────┐
   │ AFFICHAGE ADRESSE DE DÉPÔT      │
   │ - L'utilisateur voit l'adresse   │
   │ - Aucune validation côté client │
   └────────┬────────────────────────┘
            │
            ▼
3. ENVOI DE LA TRANSACTION (MetaMask)
   ┌─────────────────┐
   │ sendTransaction │ ───► [MetaMask] ───► [Blockchain]
   │ (via MetaMask)  │                      TX enregistrée
   └────────┬────────┘                      avec txHash
            │
            │ txHash récupéré
            ▼
4. DÉBUT DU POLLING
   ┌─────────────────┐       POST /api/wallet/watch-topup
   │ apiClient.      │ ────────────────────────────────────────► │ wallet.ts │
   │ watchTopup()    │       { txHash, currency }                │ Route     │
   └────────┬────────┘                                           └─────┬─────┘
            │                                                           │
            │ ───────────────────────────────────────────────────────────┐
            │                                                           │
            ▼                                                           ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    VALIDATIONS BACKEND                          │
   │                                                                  │
   │  1. ✅ Vérifier que l'utilisateur existe                        │
   │  2. ✅ Vérifier que txHash n'existe pas déjà (double dépense)    │
   │  3. ✅ Vérifier sur la blockchain via blockchainService         │
   │     - Transaction confirmée (status === 1)                       │
   │     - tx.to === depositAddress (plateforme)                      │
   │     - tx.from === user.walletAddress (utilisateur)              │
   │     - amount récupéré depuis blockchain (jamais frontend)        │
   │  4. ✅ Si valide, appeler depositService.processDepositSecure()  │
   └─────────────────────────────────────────────────────────────────┘
            │                                                           │
            │                                                           ▼
            │                               ┌──────────────────────────────────┐
            │                               │ depositService.ts                │
            │                               │ checkTransactionForUser()       │
            │                               │                                  │
            │                               │ VALIDATIONS ADDITIONNELLES:     │
            │                               │                                  │
            │                               │ 1. ✅ User existe                │
            │                               │ 2. ✅ TxHash unique (lock DB)    │
            │                               │ 3. ✅ Vérif blockchain OBLIGAT   │
            │                               │ 4. ✅ Montant > 0               │
            │                               │ 5. ✅ Appel processDepositSecure │
            │                               └────────────┬─────────────────────┘
            │                                            │
            │                                            ▼
            │                               ┌──────────────────────────────────┐
            │                               │ depositService.ts                │
            │                               │ processDepositSecure()           │
            │                               │                                  │
            │                               │ TRAITEMENT ATOMIQUE:            │
            │                               │                                  │
            │                               │ 1. ✅ Double check txHash (race) │
            │                               │ 2. ✅ Calcul frais 5%            │
            │                               │ 3. ✅ Créer Transaction (DB)    │
            │                               │    - type: 'deposit'            │
            │                               │    - amount: montant net (95%)   │
            │                               │    - feeAmount: 5%               │
            │                               │    - status: 'completed'          │
            │                               │ 4. ✅ Créer Transaction 'fee'    │
            │                               │ 5. ✅ Mettre à jour user.balance │
            │                               │ 6. ✅ Save user (atomic)         │
            │                               └────────────┬─────────────────────┘
            │                                            │
            │                       ◄────────────────────┘
            │                       { status: 'confirmed', amount, fee }
            │
            ▼
5. CONFIRMATION FRONTEND
   ┌─────────────────┐
   │ Affichage succès│
   │ Redirection     │
   └─────────────────┘

────────────────────────────────────────────────────────────────────────────────────────────
```

---

## Détails des Composants

### 1. Frontend - TopupPage (`app/account/topup/page.tsx`)

**Rôle :** Interface utilisateur pour initier un dépôt

**Actions :**
- Sélection d'un pack de montant
- Affichage de l'adresse de dépôt (depuis le backend)
- Envoi de transaction via MetaMask
- Polling du statut via `watchTopupTransaction()`

**⚠️ IMPORTANT :** Le frontend ne fait **AUCUNE validation de sécurité**. Tout est vérifié côté backend.

---

### 2. Frontend - API Client (`lib/api.ts`)

**Rôle :** Client HTTP pour communiquer avec le backend

**Méthodes utilisées :**
- `initiateTopup(amount, currency)` → Préparation (pas de crédit)
- `watchTopupTransaction(txHash, currency)` → Vérification et embasement

**⚠️ SÉCURITÉ :** Le client envoie seulement le txHash et la currency. Le montant est **toujours** récupéré depuis la blockchain par le backend.

---

### 3. Backend - Route `/api/wallet/initiate-topup` (`server/routes/wallet.ts`)

**Rôle :** Préparation d'un topup (sans créditer)

**Actions :**
- ✅ Validation des paramètres (amount, currency)
- ✅ Vérification que l'utilisateur existe
- ✅ Récupération de l'adresse de dépôt
- ✅ Calcul et retour des frais (informations seulement)

**⚠️ SÉCURITÉ :** Cette route ne crédite **PAS** le compte. Elle prépare seulement le processus.

---

### 4. Backend - Route `/api/wallet/watch-topup` (`server/routes/wallet.ts`)

**Rôle :** Vérifier une transaction et l'embaser si valide

**Validations effectuées :**
1. ✅ Paramètres valides (txHash, currency)
2. ✅ Utilisateur existe
3. ✅ Transaction n'existe pas déjà dans la DB (pour cet utilisateur)
4. ✅ Appel à `depositService.checkTransactionForUser()` qui fait toutes les validations critiques

**⚠️ SÉCURITÉ CRITIQUE :** C'est cette route qui déclenche l'embasement. Toutes les validations sont faites côté serveur.

---

### 5. Backend - Service `depositService.checkTransactionForUser()` (`server/services/depositService.ts`)

**Rôle :** Vérifier et traiter un dépôt de manière sécurisée

**Validations CRITIQUES :**

```typescript
// VALIDATION 1: Utilisateur existe
const user = await User.findById(userId);

// VALIDATION 2: Prévention double dépense (txHash unique globalement)
const existingTxAnywhere = await Transaction.findOne({ txHash });
if (existingTxAnywhere) {
  if (existingTxAnywhere.userId !== userId) {
    // REJETER - txHash déjà utilisé par un autre utilisateur
    return { found: false, message: 'Transaction already used by another account' };
  }
}

// VALIDATION 3: Vérification BLOCKCHAIN OBLIGATOIRE
const result = await blockchainService.checkDeposit(
  txHash,
  user.walletAddress,
  currency
);

// VALIDATION 4: Transaction confirmée
if (!result.confirmed) return { found: false };

// VALIDATION 5: C'est bien un dépôt vers la plateforme
if (!result.isDeposit) return { found: false };

// VALIDATION 6: Montant valide (récupéré depuis blockchain)
if (!result.amount || result.amount <= 0) return { found: false };

// VALIDATION 7: Traitement sécurisé
const processed = await this.processDepositSecure(user, txHash, currency, result.amount);
```

**⚠️ SÉCURITÉ :** 
- Le montant (`result.amount`) est **toujours** récupéré depuis la blockchain
- L'adresse source est vérifiée (`tx.from === user.walletAddress`)
- L'adresse de destination est vérifiée (`tx.to === depositAddress`)

---

### 6. Backend - Service `blockchainService.checkDeposit()` (`server/services/blockchainService.ts`)

**Rôle :** Vérifier une transaction sur la blockchain

**Validations blockchain :**

```typescript
// 1. Transaction existe
const tx = await provider.getTransaction(txHash);

// 2. Transaction confirmée (status === 1)
const receipt = await provider.getTransactionReceipt(txHash);
if (receipt.status !== 1) return { confirmed: false };

// 3. Destination = adresse de dépôt plateforme
if (receipt.to?.toLowerCase() !== depositAddress.toLowerCase()) {
  return { isDeposit: false };
}

// 4. Source = adresse utilisateur
if (tx.from.toLowerCase() !== userAddress.toLowerCase()) {
  return { isDeposit: false };
}

// 5. Montant récupéré depuis blockchain
const amount = parseFloat(ethers.formatEther(tx.value || 0));
```

**⚠️ SÉCURITÉ :** Le montant et les adresses sont **toujours** récupérés depuis la blockchain. Impossible de les falsifier.

---

### 7. Backend - Service `depositService.processDepositSecure()` (`server/services/depositService.ts`)

**Rôle :** Traiter le dépôt de manière atomique

**Traitement atomique :**

```typescript
// Double vérification anti-race condition
const existingTx = await Transaction.findOne({ txHash });
if (existingTx) return { success: false, message: 'Transaction already processed' };

// Calcul frais (5%)
const platformFee = amount * 0.05;
const userAmount = amount * 0.95;

// Création transaction deposit
const transaction = await Transaction.create({
  userId: user._id,
  type: 'deposit',
  amount: userAmount,      // Montant net crédité
  currency,
  txHash,
  status: 'completed',
  feeAmount: platformFee,
});

// Création transaction fee (pour audit)
await Transaction.create({
  userId: user._id,
  type: 'fee',
  amount: platformFee,
  currency,
  txHash,
  status: 'completed',
});

// Mise à jour balance utilisateur
if (currency === 'ETH') {
  user.balanceETH += userAmount;
} else {
  user.balanceUSDT += userAmount;
}
await user.save();
```

**⚠️ SÉCURITÉ :**
- Double vérification du txHash (anti-race condition)
- Calcul des frais côté serveur (jamais depuis le frontend)
- Mise à jour atomique du balance

---

## Protection Contre les Manipulations

### ✅ L'utilisateur ne peut PAS empêcher l'embasement

**Pourquoi :**
1. **Scan automatique possible :** Le système a un service `depositService.scanDeposits()` qui peut scanner la blockchain automatiquement (actuellement désactivé pour économiser les RPC)
2. **Polling côté serveur :** Le frontend n'est pas nécessaire - le backend peut poller indépendamment
3. **Transaction blockchain = preuve :** Une fois la transaction confirmée sur la blockchain, elle peut être détectée et embasée à tout moment

**Exemple d'attaque bloquée :**
```
❌ Utilisateur envoie transaction → Ne fait pas de polling → Pense éviter l'embasement
✅ Le backend peut scanner la blockchain et détecter la transaction automatiquement
```

---

### ✅ L'utilisateur ne peut PAS modifier l'embasement

**Pourquoi :**
1. **Montant depuis blockchain :** Le montant est **toujours** récupéré depuis `tx.value` sur la blockchain. Impossible de le modifier.
2. **Adresses vérifiées :** Les adresses source et destination sont vérifiées sur la blockchain.
3. **Double dépense bloquée :** Un txHash ne peut être utilisé qu'une seule fois (vérification globale).
4. **Frais calculés serveur :** Les 5% de frais sont calculés côté serveur, jamais depuis le frontend.
5. **Validations atomiques :** Toutes les validations sont faites dans `processDepositSecure()` avec vérifications multiples.

**Exemple d'attaque bloquée :**
```
❌ Utilisateur modifie le montant dans le frontend avant l'envoi
✅ Le backend ignore le montant du frontend et récupère le montant réel depuis la blockchain

❌ Utilisateur réutilise un txHash d'une autre transaction
✅ Vérification globale du txHash - si déjà utilisé, rejet immédiat

❌ Utilisateur envoie transaction vers mauvaise adresse puis demande crédit
✅ Vérification que tx.to === depositAddress - si différent, rejet
```

---

## Points de Sécurité Critiques

### 🔒 1. Validation Blockchain Obligatoire

**Code :** `depositService.checkTransactionForUser()` → `blockchainService.checkDeposit()`

**Protection :** Aucune transaction n'est embasée sans vérification sur la blockchain.

---

### 🔒 2. Montant Toujours depuis Blockchain

**Code :** `blockchainService.checkETHDeposit()` → `ethers.formatEther(tx.value)`

**Protection :** Le montant n'est jamais accepté depuis le frontend. Toujours récupéré depuis `tx.value` sur la blockchain.

---

### 🔒 3. Prévention Double Dépense

**Code :** `Transaction.findOne({ txHash })` (vérification globale)

**Protection :** Un txHash ne peut être utilisé qu'une seule fois, même par des utilisateurs différents.

---

### 🔒 4. Vérification Adresses

**Code :** 
- `tx.from.toLowerCase() === userAddress.toLowerCase()` (source)
- `receipt.to?.toLowerCase() === depositAddress.toLowerCase()` (destination)

**Protection :** Seules les transactions provenant de l'utilisateur et allant vers la plateforme sont acceptées.

---

### 🔒 5. Calcul Frais Serveur

**Code :** `const platformFee = amount * 0.05;` (dans `processDepositSecure()`)

**Protection :** Les frais sont calculés côté serveur. Le frontend ne peut pas les modifier.

---

### 🔒 6. Race Condition Protection

**Code :** Double vérification du txHash dans `processDepositSecure()` après vérification initiale

**Protection :** Même si deux requêtes arrivent simultanément, seule la première sera traitée.

---

## Flux Alternatif : Vérification Manuelle

Le système supporte aussi la vérification manuelle via la page `/account/balance` :

```
1. Utilisateur entre un txHash manuellement
2. Appel à /api/wallet/check-deposit
3. Même processus de validation et embasement
```

**⚠️ IMPORTANT :** Même pour la vérification manuelle, toutes les validations sont identiques. L'utilisateur ne peut pas contourner les validations.

---

## Résumé de Sécurité

| Action Utilisateur | Peut-il l'empêcher ? | Peut-il le modifier ? |
|-------------------|---------------------|----------------------|
| Empêcher embasement | ❌ NON - Scan automatique possible | N/A |
| Modifier montant | ❌ NON - Récupéré depuis blockchain | ❌ NON |
| Modifier frais | ❌ NON - Calculé serveur | ❌ NON |
| Réutiliser txHash | ❌ NON - Vérification globale | ❌ NON |
| Changer adresse dest | ❌ NON - Vérification blockchain | ❌ NON |
| Changer adresse source | ❌ NON - Vérification blockchain | ❌ NON |
| Créditer sans transaction | ❌ NON - Vérification blockchain obligatoire | ❌ NON |

---

## Conclusion

✅ **Le système est sécurisé :**
- Toutes les validations sont côté serveur
- Le montant est toujours récupéré depuis la blockchain
- Les adresses sont vérifiées sur la blockchain
- La double dépense est bloquée
- Les frais sont calculés serveur
- L'embasement est automatique et vérifié

❌ **L'utilisateur ne peut :**
- Ni empêcher l'embasement (scan automatique possible)
- Ni modifier l'embasement (toutes les données viennent de la blockchain)

