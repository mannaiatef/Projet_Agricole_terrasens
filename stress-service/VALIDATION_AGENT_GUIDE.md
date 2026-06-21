# Guide d'utilisation - Agent de Validation Stress Service

## 🎯 Vue d'ensemble

L'**Agent de Validation Stress Service** est un outil automatisé conçu pour vérifier si les valeurs retournées par le microservice `stress-service` sont correctes et cohérentes.

## 📋 Ce que valide l'agent

### 1. **Validation des réponses API**
- ✅ Format JSON correct
- ✅ Codes de statut HTTP appropriés (200, 202, 400, 404, 500)
- ✅ Présence de tous les champs obligatoires
- ✅ Types de données conformes (string, number, array, object)

### 2. **Validation des calculs NDVI**
```
NDVI = (NIR - Red) / (NIR + Red)

Plage acceptée: [-1, 1]
Précision: 4 décimales
```

**Vérifications effectuées:**
- ✅ Valeurs dans la plage [-1, 1]
- ✅ Pas de divisions par zéro
- ✅ Statistiques cohérentes (min ≤ mean ≤ max)
- ✅ Écart-type ≥ 0

### 3. **Validation de la classification du stress**
```
NDVI > 0.45           → Healthy      (vert)
0.35 < NDVI ≤ 0.45    → Medium       (orange)
NDVI ≤ 0.35           → High         (rouge)
```

**Vérifications effectuées:**
- ✅ Classification correcte selon NDVI
- ✅ Cohérence avec le niveau de stress
- ✅ Comptage des pixels stressés
- ✅ Calcul du pourcentage de stress

### 4. **Validation des zones GeoJSON**
- ✅ Format GeoJSON valide
- ✅ Type Polygon (convex hull)
- ✅ Fermeture du polygone (first point = last point)
- ✅ Coordonnées lat/lon valides ([-90,90] / [-180,180])
- ✅ Cohérence des zones avec les pixels

### 5. **Validation des alertes**
```
stress > 45%  → Alert severity = HIGH
30% < stress ≤ 45%  → Alert severity = MEDIUM
stress ≤ 15%  → Peu/pas d'alertes
```

### 6. **Validation temporelle**
- ✅ Timestamps en format ISO 8601
- ✅ Dates valides
- ✅ Cohérence des dates (created ≤ updated)

## 🚀 Installation et configuration

### Étape 1: Fichier `.env.validation`

Un fichier de configuration est déjà présent:
```bash
cat stress-service/.env.validation
```

**Variables importantes:**
```bash
STRESS_SERVICE_URL=http://localhost:3004
TEST_PARCEL_IDS=1,2,3,4,5
NDVI_PRECISION_DECIMALS=4
API_TIMEOUT=30000
```

### Étape 2: Permissions d'exécution

```bash
chmod +x stress-service/validate-stress-output.js
```

## 💻 Utilisation

### Option 1: Exécution directe (Node.js)

```bash
cd stress-service
node validate-stress-output.js
```

### Option 2: Via npm (si script npm configuré)

```bash
npm run validate:stress-service
```

### Option 3: Avec verbose output

```bash
node validate-stress-output.js --verbose
```

### Option 4: Avec variables d'environnement

```bash
# Tester des parcelles spécifiques
TEST_PARCEL_IDS=10,20,30 node validate-stress-output.js

# Changer l'URL du service
STRESS_SERVICE_URL=http://prod-server:3004 node validate-stress-output.js

# Augmenter le timeout
API_TIMEOUT=60000 node validate-stress-output.js
```

## 📊 Interprétation des résultats

### Résultat attendu (succès)

```
========== VALIDATION SUMMARY ==========
Total Checks: 145
Passed: 145
Failed: 0
Pass Rate: 100.00%
Warnings: 0
Errors: 0
```

**✅ Tous les calculs et valeurs sont corrects!**

### Résultat avec erreurs

```
========== VALIDATION SUMMARY ==========
Total Checks: 145
Passed: 142
Failed: 3
Pass Rate: 97.93%
Warnings: 2
Errors: 1
```

**⚠️ Voir la section "Erreurs courantes" ci-dessous**

## 🐛 Erreurs courantes et solutions

### Erreur 1: `Stress percentage calculation mismatch`

**Symptôme:**
```
Expected 34.82%, got 34.83%
```

**Cause:** Erreur d'arrondi mineure (acceptable)

**Solution:** Vérifier la précision de la division entière vs flottante

---

### Erreur 2: `NDVI value out of range`

**Symptôme:**
```
NDVI value: 1.05 (out of [-1, 1])
```

**Cause:** Erreur dans le calcul NDVI ou débordement entier

**Solution:** 
```javascript
// Vérifier dans NDVIService.js:
if (nir + red === 0) return 0;  // Évite division par zéro
const ndvi = Math.min(1, Math.max(-1, (nir - red) / (nir + red)));
```

---

### Erreur 3: `Polygon ring is not closed`

**Symptôme:**
```
First: [-75.123, 40.456]
Last: [-75.124, 40.457]
```

**Cause:** Fermeture manquante du polygone GeoJSON

**Solution:**
```javascript
// Dans GeoJSONService.js, ajouter avant de retourner:
const ringCopy = [...convexHullPoints];
ringCopy.push(ringCopy[0]);  // Fermer le polygone
geojson.geometry.coordinates = [ringCopy];
```

---

### Erreur 4: `Alerts missing for high stress`

**Symptôme:**
```
stress=52%, high_alerts=0
```

**Cause:** AlertService n'a pas généré l'alerte

**Solution:**
```javascript
// Dans AlertService.js:
if (stressPercentage > 45) {
  await this.createAlert(parcelId, 'high_stress', 'high', message);
}
```

---

### Erreur 5: `Connection refused to stress-service`

**Symptôme:**
```
Error: ECONNREFUSED 127.0.0.1:3004
```

**Cause:** Service non démarré

**Solution:**
```bash
# Vérifier que le stress-service est en cours d'exécution
cd stress-service
npm run dev

# Ou dans Docker
docker-compose up stress-service
```

## 📈 Cas de test couverts

### Test 1: Parcelle saine
```
Parcel ID: 1
NDVI moyen: 0.65
Stress: 5%
Résultat attendu: ✅ Pas d'alerte
```

### Test 2: Parcelle modérément stressée
```
Parcel ID: 2
NDVI moyen: 0.40
Stress: 38%
Résultat attendu: ✅ Alerte MEDIUM
```

### Test 3: Parcelle hautement stressée
```
Parcel ID: 3
NDVI moyen: 0.28
Stress: 65%
Résultat attendu: ✅ Alerte HIGH
```

### Test 4: Nombreuses zones
```
Parcel ID: 4
Zones: High (5), Medium (8), Healthy (3)
Résultat attendu: ✅ Zones cohérentes et fermées
```

### Test 5: Imagerie avec couverture nuageuse
```
Parcel ID: 5
Cloud coverage: 25%
Résultat attendu: ⚠️ Avertissement sur fiabilité
```

## 🔍 Rapport de validation détaillé

Après chaque exécution, un rapport JSON est généré:

```json
{
  "timestamp": "2024-01-15T10:45:00.000Z",
  "checks": [
    {
      "name": "GET /stress/parcel/1/latest returns 200",
      "passed": true,
      "timestamp": "2024-01-15T10:45:05.123Z",
      "details": "Got 200"
    },
    {
      "name": "NDVI value in range [-1, 1]",
      "passed": true,
      "timestamp": "2024-01-15T10:45:05.456Z",
      "details": ""
    }
  ],
  "passed": 145,
  "failed": 0,
  "errors": [],
  "warnings": [],
  "summary": {
    "endpoints_tested": 4,
    "parcels_validated": 5,
    "pass_rate": 100.0
  }
}
```

## 📝 Métriques de qualité

| Métrique | Critère | Acceptable |
|----------|---------|-----------|
| **Pass Rate** | % de checks réussis | ≥ 98% |
| **Format Errors** | Erreurs de format JSON | 0% (strict) |
| **Calculation Errors** | Erreurs de calcul | ≤ 1% (tolérance machine) |
| **Logic Errors** | Erreurs logiques | ≤ 2% |

## 🛠️ Dépannage avancé

### Activer les logs détaillés

```bash
LOG_LEVEL=debug node validate-stress-output.js --verbose
```

### Tester un service distant

```bash
STRESS_SERVICE_URL=https://prod.example.com:3004 node validate-stress-output.js
```

### Augmenter le timeout (pour serveurs lents)

```bash
API_TIMEOUT=60000 node validate-stress-output.js
```

### Tester avec parcelles spécifiques

```bash
TEST_PARCEL_IDS=123,456,789 node validate-stress-output.js
```

## 📚 Fichiers de l'agent

```
stress-service/
├── VALIDATION_AGENT.md          ← Cette documentation
├── validate-stress-output.js    ← Script de validation
├── .env.validation              ← Configuration
└── tests/
    └── validation-reports/      ← Rapports générés
        ├── latest-validation.json
        └── validation-errors.log
```

## ✅ Checklist de mise en production

Avant de déployer le stress-service, exécuter:

```bash
# 1. Vérifier le service est démarré
curl http://localhost:3004/health

# 2. Lancer la validation complète
node stress-service/validate-stress-output.js

# 3. Vérifier le pass rate ≥ 98%
echo "Pass rate must be ≥ 98%"

# 4. Consulter les erreurs
cat stress-service/tests/validation-reports/latest-validation.json | grep -A5 '"failed"'

# 5. Si tout est OK: déployer
echo "✅ Service prêt pour production"
```

## 🤝 Support et amélioration

Si l'agent détecte une erreur:

1. **Consulter** cette documentation
2. **Exécuter** avec `--verbose` pour plus de détails
3. **Vérifier** les logs du service: `docker logs stress-service`
4. **Rapporter** l'erreur avec le rapport JSON généré

---

**Dernière mise à jour:** 2024-01-15  
**Version de l'agent:** 1.0.0  
**Service testé:** stress-service v2.0+
