# Irrigation Service

A production-ready microservice for intelligent irrigation decision-making in precision agriculture. Integrates with crop calendar, stress monitoring, and weather systems to provide data-driven irrigation recommendations.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  API Gateway (Port 3000)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────────┐
        │                  │                  │                  │
   ┌────▼────┐      ┌─────▼────┐      ┌─────▼────┐      ┌─────▼────┐
   │  Crop   │      │ Irrigation│      │  Stress  │      │  Weather │
   │ Calendar│      │  Service  │      │ Service  │      │   Data   │
   │(3003)   │      │  (3004)   │      │ (3005)   │      │ (Open-   │
   └────┬────┘      └─────┬────┘      └─────┬────┘      │ Meteo)   │
        │                 │                  │          └─────────┘
        │            ┌────▼──────────────────┘
        │            │
        │      ┌─────▼──────────────────────┐
        │      │  MySQL Database            │
        │      │ (irrigation_records,       │
        │      │  irrigation_schedule,      │
        │      │  irrigation_alerts)        │
        └──────►  │ (irrigation_history)    │
               └────────────────────────────┘
        │
        │      ┌────────────────────────────┐
        │      │   Redis Queue              │
        │      │ (BullMQ) for async jobs   │
        └─────►  │ (irrigation-calculations)│
               └────────────────────────────┘
```

## Features

✅ **Intelligent Irrigation Recommendations**
- ETc (Crop evapotranspiration) calculations
- Crop coefficient (Kc) based on crop type
- Stress adjustment factors
- Humidity-based adjustments
- Rainfall forecast integration

✅ **Multi-Source Data Integration**
- Crop calendar service (parcel metadata)
- Stress service (NDVI, stress percentage)
- Open-Meteo weather API
- Real-time environmental data

✅ **Prioritized Decision-Making**
- Priority levels: LOW, MEDIUM, HIGH
- Decision reasoning with multiple factors
- Critical stress alerts

✅ **Background Processing**
- Queue-based (BullMQ) asynchronous calculations
- Daily cron job for batch processing all parcels
- Automatic schedule execution

✅ **Comprehensive Data Management**
- Irrigation history tracking
- Schedule management
- Alert system
- Monthly aggregated statistics

## Installation

```bash
# 1. Create and navigate to directory
mkdir irrigation-service
cd irrigation-service

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Initialize database
npm run setup-db

# 5. Start service
npm start       # Production
npm run dev     # Development with nodemon
```

## Environment Variables

```env
# Service
NODE_ENV=development
SERVICE_PORT=3004
SERVICE_NAME=irrigation-service

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=terrasens_irrigation

# Redis (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# External Services
CROP_CALENDAR_SERVICE_URL=http://localhost:3003
STRESS_SERVICE_URL=http://localhost:3005
WEATHER_API_URL=https://api.open-meteo.com/v1
WEATHER_API_KEY=        # Not required for Open-Meteo

# Features
ENABLE_CRON_JOBS=true
ENABLE_QUEUE=true
LOG_LEVEL=info
```

## API Endpoints

### 1. Get Latest Recommendation
```http
GET /irrigation/:parcelId
```

**Response (200)**
```json
{
  "success": true,
  "message": "Latest irrigation recommendation",
  "data": {
    "id": 1,
    "parcel_id": 5,
    "water_amount": 25.5,
    "duration": 102,
    "priority": "HIGH",
    "recommended_time": "2026-04-08T06:00:00.000Z",
    "status": "PENDING",
    "created_at": "2026-04-08T10:30:45.000Z"
  }
}
```

### 2. Calculate Irrigation (Sync)
```http
POST /irrigation/calculate/:parcelId
```

**Response (201)**
```json
{
  "success": true,
  "message": "Irrigation calculation completed",
  "data": {
    "parcel_id": 5,
    "parcel_name": "Field A",
    "crop_name": "maize",
    "area_hectares": 10,
    "water_amount_mm": 25.5,
    "water_volume_m3": 2550,
    "duration_minutes": 102,
    "priority": "HIGH",
    "recommended_time": "06:00",
    "calculations": {
      "et0": 5.2,
      "kc": 0.9,
      "etc": 4.68,
      "base_water_amount": 4.68,
      "stress_adjustment": 1.2,
      "humidity_adjustment": 0.91
    },
    "conditions": {
      "stress_percentage": 52,
      "stress_score": 45,
      "ndvi": 0.65,
      "temperature": 28,
      "humidity": 55,
      "rain_forecast_24h": 0,
      "weather_description": "Clear sky"
    },
    "location": {
      "latitude": 36.938837,
      "longitude": 10.151496,
      "polygon": {...}
    },
    "decision_reason": "High water stress (52%); Low humidity (55%) - increased irrigation"
  }
}
```

### 3. Create Irrigation Schedule
```http
POST /irrigation/schedule

{
  "parcel_id": 5,
  "scheduled_time": "2026-04-08T06:00:00Z",
  "water_amount": 25.5,
  "duration": 102,
  "reason": "Automatic daily calculation"
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "Irrigation scheduled successfully",
  "data": {
    "id": 12,
    "parcel_id": 5,
    "scheduled_time": "2026-04-08T06:00:00.000Z",
    "water_amount": 25.5,
    "duration": 102,
    "reason": "Automatic daily calculation",
    "status": "PENDING"
  }
}
```

### 4. Get Irrigation History
```http
GET /irrigation/history/:parcelId?limit=30
```

**Response (200)**
```json
{
  "success": true,
  "message": "Irrigation history retrieved",
  "data": [
    {
      "id": 1,
      "parcel_id": 5,
      "water_amount": 25.5,
      "duration": 102,
      "priority": "HIGH",
      "status": "PENDING",
      "created_at": "2026-04-08T10:30:45.000Z"
    }
  ],
  "count": 1
}
```

### 5. Get Next Scheduled
```http
GET /irrigation/schedule/:parcelId
```

**Response (200)**
```json
{
  "success": true,
  "message": "Next scheduled irrigation",
  "data": {
    "id": 12,
    "parcel_id": 5,
    "scheduled_time": "2026-04-08T06:00:00.000Z",
    "status": "PENDING",
    "water_amount": 25.5,
    "duration": 102
  }
}
```

### 6. Execute Schedule
```http
POST /irrigation/schedule/:scheduleId/execute
```

**Response (200)**
```json
{
  "success": true,
  "message": "Irrigation schedule executed"
}
```

### 7. Health Check
```http
GET /health
```

**Response (200)**
```json
{
  "status": "ok",
  "service": "irrigation-service",
  "timestamp": "2026-04-08T10:35:00.000Z"
}
```

## Database Schema

### irrigation_records
Stores all irrigation calculations and recommendations

```sql
CREATE TABLE irrigation_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parcel_id INT NOT NULL,
  water_amount DECIMAL(10,2) NOT NULL,     -- mm
  duration INT NOT NULL,                    -- minutes
  priority ENUM('LOW','MEDIUM','HIGH'),
  recommended_time DATETIME,
  status ENUM('PENDING','COMPLETED','CANCELLED'),
  weather_data JSON,
  stress_data JSON,
  crop_data JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

### irrigation_schedule
Planned irrigation activities

```sql
CREATE TABLE irrigation_schedule (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parcel_id INT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  status ENUM('PENDING','EXECUTED','SKIPPED','CANCELLED'),
  water_amount DECIMAL(10,2),
  duration INT,
  reason VARCHAR(255),
  executed_at DATETIME,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### irrigation_alerts
Alerts for critical conditions

```sql
CREATE TABLE irrigation_alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parcel_id INT NOT NULL,
  alert_type ENUM('HIGH_STRESS','LOW_NDVI','EXTREME_WEATHER'),
  message VARCHAR(255),
  severity ENUM('INFO','WARNING','CRITICAL'),
  status ENUM('OPEN','ACKNOWLEDGED','RESOLVED'),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Irrigation Logic

### Water Requirement Calculation

**ETc = ET0 × Kc**

Where:
- **ET0**: Reference evapotranspiration (from weather API)
- **Kc**: Crop coefficient (based on crop type and growth stage)
- **ETc**: Crop water requirement in mm

### Adjustment Factors

1. **Stress Adjustment** (0.7 - 1.3x)
   - High NDVI (>0.6) → 1.0x
   - Low NDVI (<0.4) → 1.2x
   - High stress (>50%) → 1.3x
   - Moderate stress (30-50%) → 1.15x

2. **Humidity Adjustment**
   - Humidity >80% → 0.7x (reduce water)
   - Humidity <40% → 1.15x (increase water)

3. **Rainfall Forecast**
   - Forecast >10mm → LOW priority
   - HIGH stress + no rain → HIGH priority

### Priority Assignment

| Condition | Priority |
|-----------|----------|
| Stress >50% OR Forecast >10mm | HIGH |
| Stress 30-50% | MEDIUM |
| Stress <30% | LOW |

### Recommended Irrigation Time

- **Early morning (6:00 AM)**: High temp & low humidity
- **Late evening (6:30 PM)**: Moderate conditions
- **Early morning (7:00 AM)**: Cool & humid

## Background Jobs

### Daily Calculation (5:00 AM UTC)
Automatically calculates irrigation for all parcels daily

```javascript
// Queues jobs for all parcels
for (const parcel of parcels) {
  queue.add('irrigation-calculation', { parcelId: parcel.id });
}
```

### Schedule Execution (Every 30 min)
Checks and executes pending schedules

### Weekly Summary (8:00 AM Monday)
Generates aggregated reports

## Error Handling

| Error | Status | Reason |
|-------|--------|--------|
| Parcel not found | 404 | Invalid parcel ID |
| Missing parameters | 400 | Required fields missing |
| Service unavailable | 503 | External service down |
| Database error | 500 | Query failed |

## Testing

```bash
# Test health endpoint
curl http://localhost:3004/health

# Calculate irrigation for parcel 5
curl -X POST http://localhost:3004/irrigation/calculate/5

# Get latest recommendation
curl http://localhost:3004/irrigation/5

# Get history
curl http://localhost:3004/irrigation/history/5?limit=30

# Create schedule
curl -X POST http://localhost:3004/irrigation/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "parcel_id": 5,
    "scheduled_time": "2026-04-09T06:00:00Z",
    "water_amount": 25.5,
    "duration": 102,
    "reason": "Manual scheduling"
  }'
```

## Performance Considerations

- **Queue processing**: 5 concurrent workers
- **Database connection pool**: 10 connections
- **Schedule check**: Every 30 minutes
- **Daily batch**: Overnight processing (5:00 AM)
- **Caching**: None (real-time calculations)

## Integration Points

1. **Crop Calendar Service**: `/parcelles/internal/:id` → parcel metadata
2. **Stress Service**: `/stress/:parcelId` → NDVI, stress data
3. **Weather API**: Open-Meteo → current & forecast data
4. **API Gateway**: Routes all external requests

## Monitoring & Logging

All operations logged with timestamps:
- INFO: Normal operations
- WARN: Alerts and warnings
- ERROR: Failures and exceptions
- DEBUG: Detailed diagnostics

```
[2026-04-08T10:35:00.000Z] INFO: IrrigationService.calculateIrrigation completed { parcelId: 5, priority: HIGH, waterAmount: 25.5 }
[2026-04-08T10:36:15.000Z] WARN: Alert created: parcel_id=5, type=HIGH_STRESS
[2026-04-08T10:37:00.000Z] ERROR: StressService.getStressData failed { parcelId: 5, error: 'Connection timeout' }
```

## Production Deployment

1. **Environment**: Set NODE_ENV=production
2. **Database**: Use managed MySQL (AWS RDS, Azure Database)
3. **Redis**: Use managed Redis (AWS ElastiCache, Azure Cache)
4. **Logging**: Integrate ELK, Datadog, or CloudWatch
5. **Monitoring**: Alert on job failures, queue backlog
6. **Scaling**: Docker containers, Kubernetes orchestration

## Troubleshooting

**Queue not processing**: Check Redis connection
**No data from external services**: Verify service URLs and firewall
**High water recommendations**: Check NDVI and stress data
**Schedules not executing**: Verify Redis and cron job logs

## License

MIT
