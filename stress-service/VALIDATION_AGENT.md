# Stress Service Validation Agent

## Vue d'ensemble
Cet agent spécialisé valide la correction des valeurs retournées par le microservice stress-service. Il effectue des vérifications automatisées sur les calculs NDVI, les classifications de stress et les formats de données.

## Responsabilités

### 1. Validation des réponses API
- ✓ Vérifier le format des réponses JSON
- ✓ Valider les codes de statut HTTP attendus
- ✓ Vérifier la présence des champs obligatoires
- ✓ Valider les types de données

### 2. Validation des calculs NDVI
- ✓ Vérifier les valeurs NDVI: -1 ≤ NDVI ≤ 1
- ✓ Vérifier la formule: (NIR - Red) / (NIR + Red)
- ✓ Valider les statistiques (moyenne, médiane, écart-type)
- ✓ Vérifier l'absence de divisions par zéro

### 3. Validation des classifications de stress
- ✓ Vérifier la classification correcte:
  - `healthy`: NDVI > 0.45
  - `medium`: 0.35 < NDVI ≤ 0.45
  - `high`: NDVI ≤ 0.35
- ✓ Valider la cohérence des comptes de pixels
- ✓ Vérifier le calcul du pourcentage de stress

### 4. Validation des zones géographiques
- ✓ Vérifier les coordonnées GeoJSON valides
- ✓ Valider les polygones (convex hull)
- ✓ Vérifier la cohérence des zones avec les pixels
- ✓ Valider les aires de zones

### 5. Validation des données temporelles
- ✓ Vérifier les timestamps ISO 8601
- ✓ Valider les dates d'imagerie satellitaire
- ✓ Vérifier la cohérence des dates

### 6. Validation des alertes
- ✓ Vérifier la logique de génération des alertes
- ✓ Valider les niveaux de sévérité
- ✓ Vérifier la cohérence avec le pourcentage de stress

## Endpoints validés

```
GET  /stress/parcel/:id/latest
POST /stress/analyze
GET  /stress/jobs/:jobId
GET  /stress/parcel/:id/map
GET  /stress/parcel/:id/map/history
GET  /stress/parcel/:id/alerts
POST /stress/bulk-analyze
GET  /stress/queue/stats
GET  /health/detailed
```

## Cas de test

### Test 1: Validation des réponses
```javascript
validateResponse({
  endpoint: '/stress/parcel/:id/latest',
  expectedFields: ['record', 'zones', 'alerts', 'summary', 'heatmap'],
  dataTypes: {
    'record.mean_ndvi': 'number',
    'record.stress_percentage': 'number',
    'record.pixel_count': 'number',
    'zones': 'array',
    'alerts': 'array'
  }
})
```

### Test 2: Validation NDVI
```javascript
validateNDVI({
  ndvi: 0.4632,
  constraints: {
    min: -1,
    max: 1,
    precision: 4  // 4 décimales
  }
})
```

### Test 3: Validation classification
```javascript
validateClassification({
  ndviValue: 0.28,
  expectedClass: 'high',  // Doit retourner 'high'
  pixelCount: 22808,
  stressPercentage: 34.82
})
```

### Test 4: Validation GeoJSON
```javascript
validateGeoJSON({
  zone: { /* zone object */ },
  constraints: {
    type: 'Polygon',
    minCoordinates: 4,  // Triangle + point de fermeture
    coordinatePrecision: 6
  }
})
```

### Test 5: Validation des alertes
```javascript
validateAlerts({
  stressPercentage: 45,
  alerts: [ /* alerts array */ ],
  rules: {
    stressAbove45: 'severity should be high',
    stressAbove30: 'alert should exist',
    stressBelow15: 'no alert expected'
  }
})
```

## Règles de validation

### Règles numériques
| Champ | Plage | Précision | Unité |
|-------|-------|-----------|-------|
| `mean_ndvi` | [-1, 1] | 4 décimales | adimensionnel |
| `stress_percentage` | [0, 100] | 2 décimales | % |
| `cloud_coverage` | [0, 100] | 1 décimale | % |
| `zone_area` | [0, ∞) | 8 décimales | degrés² |
| `pixel_count` | [0, ∞) | entier | pixels |

### Règles logiques
| Condition | Validation |
|-----------|-----------|
| `stressed_pixels ≤ pixel_count` | Toujours vrai |
| `(stressed_pixels / pixel_count) * 100 = stress_percentage` | Cohérence |
| `high_zones + medium_zones + healthy_zones = total_zones` | Sommation |
| `sum(zone_areas) ≤ parcel_area` | Couverture |
| `sum(zone_pixels) ≤ total_pixels` | Comptage |

### Règles de plausibilité
| Situation | Validation |
|-----------|-----------|
| `mean_ndvi = 0.15` | Stress très élevé attendu |
| `stress_percentage > 50%` | Alerte sévérité HIGH attendue |
| `cloud_coverage > 50%` | Imagerie dégradée, résultat fiable? |
| `imagery_date` ancien | Données obsolètes? |

## Métriques de qualité

```
Taux de réussite de validation = (checks passed / total checks) * 100%

Critères d'acceptation:
- Format: 100% (strict)
- Calculs: ≥ 99% (tolérance machine)
- Logique: ≥ 98%
- Plausibilité: ≥ 95%
```

## Utilisation

```bash
# Lancer l'agent de validation
npm run validate:stress-service

# Valider un endpoint spécifique
npm run validate:stress-service -- --endpoint /stress/parcel/:id/latest

# Valider avec les données historiques
npm run validate:stress-service -- --with-history

# Générer un rapport détaillé
npm run validate:stress-service -- --report=detailed
```

## Configuration

Fichier: `.env.validation`
```bash
# URLs
STRESS_SERVICE_URL=http://localhost:3004
CROP_CALENDAR_SERVICE_URL=http://localhost:3002

# Parcelles de test
TEST_PARCEL_IDS=1,2,3,4,5

# Seuils de tolérance
NDVI_PRECISION_DECIMALS=4
PERCENTAGE_PRECISION=2

# Timeouts
API_TIMEOUT=30000
```

## Rapports de validation

Les rapports sont générés dans `./tests/validation-reports/`:
- `latest-validation.json` - Dernier rapport complet
- `validation-summary.txt` - Résumé textuel
- `validation-errors.log` - Erreurs détaillées
- `validation-trends.json` - Tendances temporelles
