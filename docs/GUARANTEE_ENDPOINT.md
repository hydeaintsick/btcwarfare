# Endpoint de Garantie des Transactions

## Description

L'endpoint `/api/guaranteetx/:key` permet de garantir que toutes les transactions des 24 dernières heures vers l'adresse de dépôt de la plateforme sont embasées en base de données.

Cet endpoint est conçu pour être appelé automatiquement par un service de cron externe (toutes les minutes).

## Configuration

### Variable d'environnement

Ajoutez dans votre fichier `.env` :

```env
PRIVATE_API_KEY=votre_cle_secrete_tres_longue_et_aleatoire_ici
```

**⚠️ IMPORTANT :** Utilisez une clé longue et aléatoire pour la sécurité. Exemple :
```bash
# Générer une clé sécurisée
openssl rand -hex 32
```

## Endpoint

### URL

```
GET /api/guaranteetx/:key
```

### Exemple d'utilisation

```bash
# Appel direct
curl https://votre-domaine.com/api/guaranteetx/votre_cle_secrete

# Avec variable d'environnement
curl https://votre-domaine.com/api/guaranteetx/$PRIVATE_API_KEY
```

### Réponse en cas de succès

```json
{
  "success": true,
  "message": "Scan completed. Processed 2 new deposits.",
  "report": {
    "startTime": "2024-01-15T10:30:00.000Z",
    "endTime": "2024-01-15T10:30:15.000Z",
    "fromBlock": 18000000,
    "toBlock": 18008000,
    "scannedBlocks": 8000,
    "depositsFound": {
      "eth": [
        {
          "txHash": "0x...",
          "from": "0x...",
          "amount": 0.1,
          "blockNumber": 18007500,
          "timestamp": "2024-01-15T09:45:00.000Z"
        }
      ],
      "usdt": []
    },
    "depositsProcessed": {
      "eth": 1,
      "usdt": 0
    },
    "depositsSkipped": {
      "alreadyProcessed": 3,
      "noUser": 0,
      "invalid": 0
    },
    "errors": []
  }
}
```

### Réponse en cas d'erreur

#### Clé invalide (401)
```json
{
  "success": false,
  "error": "Unauthorized: Invalid API key"
}
```

#### RPC non configuré (500)
```json
{
  "success": false,
  "error": "RPC_URL not configured. Cannot scan blockchain."
}
```

## Fonctionnement

1. **Vérification de la clé API** : L'endpoint vérifie que la clé fournie correspond à `PRIVATE_API_KEY`

2. **Scan de la blockchain** : 
   - Scanne les ~8000 derniers blocks (environ 24 heures)
   - Recherche les transactions ETH et USDT vers l'adresse de dépôt
   - Limite à 100 blocks par scan pour éviter les timeouts (peut être ajusté)

3. **Comparaison avec la base** :
   - Vérifie si chaque transaction trouvée existe déjà en base
   - Ignore les transactions déjà traitées
   - Ignore les transactions d'utilisateurs non enregistrés
   - Ignore les transactions invalides (non confirmées, montant = 0)

4. **Embasement automatique** :
   - Utilise `depositService.processDepositSecure()` pour embaser chaque transaction valide
   - Applique les frais de plateforme (5%)
   - Met à jour le balance de l'utilisateur

## Configuration d'un Cron Externe

### Option 1 : Cron GitHub Actions

Créer `.github/workflows/guarantee-tx.yml` :

```yaml
name: Guarantee Transactions

on:
  schedule:
    - cron: '*/1 * * * *'  # Toutes les minutes
  workflow_dispatch:  # Permet de déclencher manuellement

jobs:
  guarantee:
    runs-on: ubuntu-latest
    steps:
      - name: Call guarantee endpoint
        run: |
          curl -X GET "https://votre-domaine.com/api/guaranteetx/${{ secrets.PRIVATE_API_KEY }}"
```

### Option 2 : Cron sur serveur Linux

Ajouter dans `crontab -e` :

```bash
# Scanner toutes les minutes
* * * * * curl -X GET "https://votre-domaine.com/api/guaranteetx/VOTRE_CLE_SECRETE" > /dev/null 2>&1
```

### Option 3 : Service de monitoring (Uptime Robot, etc.)

- URL : `https://votre-domaine.com/api/guaranteetx/VOTRE_CLE_SECRETE`
- Méthode : GET
- Intervalle : 1 minute
- Type : HTTP(s)

### Option 4 : Script Node.js simple

Créer `scripts/guarantee-cron.js` :

```javascript
const https = require('https');

const API_KEY = process.env.PRIVATE_API_KEY;
const API_URL = process.env.API_URL || 'http://localhost:3001';

function callGuarantee() {
  const url = `${API_URL}/api/guaranteetx/${API_KEY}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const response = JSON.parse(data);
      console.log(`[${new Date().toISOString()}] ${response.message}`);
      if (response.report) {
        console.log(`  - Processed: ${response.report.depositsProcessed.eth + response.report.depositsProcessed.usdt} deposits`);
        console.log(`  - Skipped: ${response.report.depositsSkipped.alreadyProcessed} already processed`);
      }
    });
  }).on('error', (err) => {
    console.error(`Error calling guarantee endpoint: ${err.message}`);
  });
}

// Appeler toutes les minutes
setInterval(callGuarantee, 60 * 1000);
callGuarantee(); // Appel immédiat

console.log('Guarantee cron started. Calling endpoint every minute...');
```

## Performance

- **Temps d'exécution** : ~5-30 secondes selon le nombre de blocks à scanner
- **Scan limité à 100 blocks** : Pour éviter les timeouts, le scan ETH est limité aux 100 derniers blocks. Si besoin, augmenter dans le code.
- **Appels RPC** : ~100-200 appels RPC par scan selon les transactions trouvées

## Sécurité

✅ **Clé API en variable d'environnement** : Jamais hardcodée dans le code
✅ **Vérification de clé obligatoire** : Toute requête sans clé valide est rejetée
✅ **Logs de sécurité** : Toutes les tentatives d'accès sont loggées
✅ **Même validations que le frontend** : Utilise `processDepositSecure()` avec toutes les validations

## Logs

L'endpoint génère des logs détaillés :

```
[GUARANTEE] Starting transaction guarantee scan for last 24 hours...
[GUARANTEE] Scanning blocks 18000000 to 18008000 (last 24 hours)
[GUARANTEE] Scanning ETH transactions...
[GUARANTEE] Scanning USDT transactions...
✅ [GUARANTEE] Processed ETH deposit: 0x... (0.1 ETH)
✅ [GUARANTEE] Processed USDT deposit: 0x... (100 USDT)
[GUARANTEE] Scan completed: 2 deposits processed, 5 found, 3 already processed
```

## Monitoring

Il est recommandé de :
- Monitorer les logs pour détecter les erreurs
- Vérifier que l'endpoint est appelé régulièrement
- Alerter en cas d'erreur répétée (RPC down, etc.)

## Notes importantes

⚠️ **Scan limité** : Le scan ETH est limité aux 100 derniers blocks par appel pour éviter les timeouts. Pour garantir un scan complet des 24h, appeler toutes les minutes.

⚠️ **Coûts RPC** : Si vous utilisez un RPC payant (Infura, Alchemy), attention aux limites de taux. Le scan peut générer ~100-200 appels RPC par minute.

✅ **Idempotent** : L'endpoint est idempotent - appeler plusieurs fois ne créera pas de doublons (vérification de txHash en base).

