# Irrigation Service - Database & Recommendation Storage

## Tables créées

### 1. **irrigation_recommendations** (NOUVELLE TABLE)
Table pour stocker les rapports détaillés des recommandations d'irrigation.

**Colonnes principales:**
- `id` - ID unique du rapport
- `parcel_id` - ID de la parcelle
- `parcel_name`, `crop_name`, `area_hectares` - Informations de la parcelle
- `water_amount_mm` - Quantité d'eau recommandée (mm)
- `water_volume_m3` - Volume d'eau (m³)
- `duration_minutes` - Durée d'irrigation (minutes)
- `priority` - Priorité (LOW, MEDIUM, HIGH)
- `recommended_time` - Heure recommandée
- `decision_reason` - Justification de la recommandation
- **Calculs détaillés:**
  - `et0` - Évapotranspiration de référence
  - `kc` - Coefficient cultural
  - `etc` - Évapotranspiration cultural
  - `base_water_amount` - Quantité de base
  - `stress_adjustment` - Ajustement pour le stress
  - `humidity_adjustment` - Ajustement pour l'humidité
- **Conditions actuelles:**
  - `stress_percentage` - Pourcentage de stress
  - `stress_score` - Score de stress (0-100)
  - `ndvi` - Indice NDVI
  - `temperature` - Température
  - `humidity` - Humidité
  - `rain_forecast_24h` - Pluie prévue (24h)
  - `weather_description` - Description météo
- **Localisation:**
  - `parcel_latitude`, `parcel_longitude` - Coordonnées GPS
- `created_at`, `updated_at` - Timestamps

**Index:**
- `idx_parcel_id` - Pour requêtes par parcelle
- `idx_created_at` - Pour tri chronologique
- `idx_priority` - Pour filtrer par priorité

### 2. Tables existantes
- `irrigation_records` - Historique des irrigations exécutées
- `irrigation_schedule` - Calendrier d'irrigation programmé
- `irrigation_history` - Statistiques mensuelles
- `irrigation_alerts` - Alertes d'irrigation

## Endpoints APIs créés

### Récupérer les détails de recommandation
```
GET /api/irrigation/:parcelId
- Retourne la dernière recommandation complète
- Calcule en temps réel si aucune n'existe en cache
```

### Historique détaillé des recommandations
```
GET /api/irrigation/reports/history/:parcelId?limit=50
- Retourne les 50 derniers rapports (default)
- Colonnes: id, parcel_name, crop_name, water_amount_mm, water_volume_m3, 
            duration_minutes, priority, stress_percentage, ndvi, temperature, 
            humidity, created_at
```

### Recommandations par plage de dates
```
GET /api/irrigation/reports/date-range/:parcelId?startDate=2026-04-01&endDate=2026-04-09
- Retourne tous les rapports dans la plage de dates spécifiée
```

## Processus de sauvegarde

### Avant (ancien)
```
GET /irrigation/:parcelId -> Pas de sauvegarde automatique
```

### Après (nouveau)
```
GET /irrigation/:parcelId -> Calcule -> Sauvegarde dans BD -> Retourne
```

**Flux détaillé:**
1. Utilisateur demande recommendation pour parcelle 27
2. Service calcule les besoins en irrigation
3. Service **sauvegarde automatiquement** dans `irrigation_recommendations`
4. Retourne la recommandation au frontend

## Données sauvegardées

Chaque rapport contient:
- ✅ Tous les paramètres de calcul (ET₀, Kc, ETc, etc.)
- ✅ Conditions actuelles (stress, NDVI, météo)
- ✅ Recommandations (quantité, durée, priorité, heure)
- ✅ Justification de la décision
- ✅ Données de localisation (GPS)
- ✅ Timestamp de création

## Utilisation en base de données

### Voir tous les rapports d'une parcelle
```sql
SELECT id, created_at, water_amount_mm, priority, stress_percentage, ndvi
FROM irrigation_recommendations
WHERE parcel_id = 27
ORDER BY created_at DESC
LIMIT 50;
```

### Analyser les tendances de stress
```sql
SELECT DATE(created_at) as date, AVG(stress_percentage) as avg_stress, 
       AVG(ndvi) as avg_ndvi
FROM irrigation_recommendations
WHERE parcel_id = 27
GROUP BY DATE(created_at);
```

### Trouver les recommandations critiques
```sql
SELECT * FROM irrigation_recommendations
WHERE parcel_id = 27 AND priority = 'HIGH'
ORDER BY created_at DESC;
```

## Intégration Frontend

### Récupérer l'historique des rapports
```typescript
// Dans le composant d'irrigation
this.irrigationService.getHistory(parcelId).subscribe(history => {
  // history contient les 30 derniers rapports détaillés
  console.log(history);
});
```

### Afficher les rapports par plage de dates
```typescript
// Exemple: derniers 7 jours
const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const endDate = new Date();
this.irrigationService.getByDateRange(parcelId, startDate, endDate).subscribe(reports => {
  // reports contient tous les rapports de la semaine
});
```

## Avantages

1. **Historique complet** - Traçabilité de tous les calculs
2. **Analyse des tendances** - Données pour graphiques et statistiques
3. **Optimisation** - Identifier les patterns et améliorer les calculs
4. **Conformité** - Tous les rapports sont archivés et auditable
5. **Debugging** - Revoir les données exactes d'une recommandation

## Próximas étapes

1. ✅ Tables créées
2. ✅ Repository avec méthodes CRUD
3. ✅ Service sauvegarde automatique
4. ✅ Endpoints API pour récupérer l'historique
5. ⏳ Frontend: Ajouter interface pour visualiser l'historique
6. ⏳ Graphiques: Tendances de stress et NDVI
