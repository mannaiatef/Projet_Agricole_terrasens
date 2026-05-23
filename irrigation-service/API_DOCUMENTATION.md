# Irrigation Service API Documentation

## Base URL
```
http://localhost:3004
```

## Authentication
Currently authentication is handled at API Gateway level. This service can be configured to use JWT tokens.

---

## 1. Health Check

### Request
```http
GET /health
```

### Response (200 OK)
```json
{
  "status": "ok",
  "service": "irrigation-service",
  "timestamp": "2026-04-08T10:35:00.123Z"
}
```

---

## 2. Get Latest Irrigation Recommendation

Retrieves the most recent irrigation recommendation for a parcel.

### Request
```http
GET /irrigation/:parcelId
```

### Parameters
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| parcelId | integer | URL | Yes | Parcel identifier |

### Response (200 OK)
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
    "weather_data": null,
    "stress_data": null,
    "crop_data": null,
    "created_at": "2026-04-08T10:30:45.000Z",
    "updated_at": "2026-04-08T10:30:45.000Z"
  }
}
```

### Response (404 Not Found)
```json
{
  "success": false,
  "message": "No irrigation recommendation found for this parcel"
}
```

### Example
```bash
curl http://localhost:3004/irrigation/5
```

---

## 3. Calculate Irrigation Requirements

Calculates irrigation needs for a parcel using real-time data from external services.

### Request
```http
POST /irrigation/calculate/:parcelId
```

### Parameters
| Name | Type | Location | Required |
|------|------|----------|----------|
| parcelId | integer | URL | Yes |

### Response (201 Created)
```json
{
  "success": true,
  "message": "Irrigation calculation completed",
  "data": {
    "parcel_id": 5,
    "parcel_name": "Field A North",
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
      "humidity_adjustment": 0.909
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
      "polygon": {
        "type": "Polygon",
        "coordinates": [[[10.151, 36.938], [10.152, 36.938], [10.152, 36.939], [10.151, 36.939], [10.151, 36.938]]]
      }
    },
    "decision_reason": "High water stress (52%); Low humidity (55%) - increased irrigation"
  }
}
```

### Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Parcel 999 not found",
  "error": "Parcel 999 not found"
}
```

### Example
```bash
curl -X POST http://localhost:3004/irrigation/calculate/5
```

---

## 4. Create Irrigation Schedule

Schedules irrigation for a specific time.

### Request
```http
POST /irrigation/schedule
Content-Type: application/json

{
  "parcel_id": 5,
  "scheduled_time": "2026-04-09T06:00:00Z",
  "water_amount": 25.5,
  "duration": 102,
  "reason": "High water stress detected"
}
```

### Body Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| parcel_id | integer | Yes | Parcel identifier |
| scheduled_time | ISO-8601 | Yes | Scheduling datetime |
| water_amount | decimal | Yes | Water amount in mm |
| duration | integer | Yes | Duration in minutes |
| reason | string | No | Reason/notes for scheduling |

### Response (201 Created)
```json
{
  "success": true,
  "message": "Irrigation scheduled successfully",
  "data": {
    "id": 15,
    "parcel_id": 5,
    "scheduled_time": "2026-04-09T06:00:00.000Z",
    "water_amount": 25.5,
    "duration": 102,
    "reason": "High water stress detected",
    "status": "PENDING"
  }
}
```

### Response (400 Bad Request)
```json
{
  "success": false,
  "message": "parcel_id, scheduled_time, water_amount, and duration are required"
}
```

### Example
```bash
curl -X POST http://localhost:3004/irrigation/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "parcel_id": 5,
    "scheduled_time": "2026-04-09T06:00:00Z",
    "water_amount": 25.5,
    "duration": 102,
    "reason": "Automatic calculation"
  }'
```

---

## 5. Get Irrigation History

Retrieves past irrigation records for a parcel.

### Request
```http
GET /irrigation/history/:parcelId?limit=30
```

### Parameters
| Name | Type | Location | Required | Default | Description |
|------|------|----------|----------|---------|-------------|
| parcelId | integer | URL | Yes | - | Parcel identifier |
| limit | integer | Query | No | 30 | Number of records to return |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Irrigation history retrieved",
  "data": [
    {
      "id": 35,
      "parcel_id": 5,
      "water_amount": 25.5,
      "duration": 102,
      "priority": "HIGH",
      "recommended_time": "2026-04-08T06:00:00.000Z",
      "status": "COMPLETED",
      "created_at": "2026-04-08T10:30:45.000Z"
    },
    {
      "id": 34,
      "parcel_id": 5,
      "water_amount": 20,
      "duration": 80,
      "priority": "MEDIUM",
      "recommended_time": "2026-04-07T18:30:00.000Z",
      "status": "COMPLETED",
      "created_at": "2026-04-07T10:15:30.000Z"
    }
  ],
  "count": 2
}
```

### Example
```bash
curl "http://localhost:3004/irrigation/history/5?limit=50"
```

---

## 6. Get Next Scheduled Irrigation

Retrieves the next scheduled irrigation for a parcel.

### Request
```http
GET /irrigation/schedule/:parcelId
```

### Parameters
| Name | Type | Location | Required |
|------|------|----------|----------|
| parcelId | integer | URL | Yes |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Next scheduled irrigation",
  "data": {
    "id": 15,
    "parcel_id": 5,
    "scheduled_time": "2026-04-09T06:00:00.000Z",
    "status": "PENDING",
    "water_amount": 25.5,
    "duration": 102,
    "reason": "Automatic calculation"
  }
}
```

### Response (404 Not Found)
```json
{
  "success": false,
  "message": "No scheduled irrigation found"
}
```

### Example
```bash
curl http://localhost:3004/irrigation/schedule/5
```

---

## 7. Execute Irrigation Schedule

Marks a scheduled irrigation as executed.

### Request
```http
POST /irrigation/schedule/:scheduleId/execute
```

### Parameters
| Name | Type | Location | Required |
|------|------|----------|----------|
| scheduleId | integer | URL | Yes |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Irrigation schedule executed"
}
```

### Example
```bash
curl -X POST http://localhost:3004/irrigation/schedule/15/execute
```

---

## Data Models

### IrrigationRecord
Complete irrigation calculation result

```typescript
{
  id: number;
  parcel_id: number;
  water_amount: number;           // mm
  duration: number;               // minutes
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_time?: Date;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  weather_data?: {
    temperature: number;
    humidity: number;
    et0: number;
    precipitation: number;
    // ... more fields
  };
  stress_data?: {
    mean_ndvi: number;
    stress_percentage: number;
    status: string;
  };
  crop_data?: {
    crop_name: string;
    area_hectares: number;
  };
  created_at: Date;
  updated_at: Date;
}
```

### IrrigationSchedule
Planned irrigation event

```typescript
{
  id: number;
  parcel_id: number;
  scheduled_time: Date;
  status: 'PENDING' | 'EXECUTED' | 'SKIPPED' | 'CANCELLED';
  water_amount: number;
  duration: number;
  reason?: string;
  executed_at?: Date;
  created_at: Date;
}
```

### Recommendation
Full calculation breakdown

```typescript
{
  parcel_id: number;
  parcel_name: string;
  crop_name: string;
  area_hectares: number;
  water_amount_mm: number;
  water_volume_m3: number;
  duration_minutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_time: string;        // HH:MM format
  
  calculations: {
    et0: number;                   // Reference evapotranspiration
    kc: number;                    // Crop coefficient
    etc: number;                   // Crop water requirement
    base_water_amount: number;
    stress_adjustment: number;     // 0.7 - 1.3x multiplier
    humidity_adjustment: number;   // Adjustment factor
  };
  
  conditions: {
    stress_percentage: number;     // 0-100%
    stress_score: number;          // 0-100
    ndvi: number;                  // -1 to 1, higher = healthier
    temperature: number;           // °C
    humidity: number;              // 0-100%
    rain_forecast_24h: number;     // mm
    weather_description: string;
  };
  
  location: {
    latitude: number;
    longitude: number;
    polygon: GeoJSON.Polygon;
  };
  
  decision_reason: string;         // Human-readable explanation
}
```

---

## Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 200 | Success | Operation completed |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Parcel or record not found |
| 500 | Internal Error | Server error |
| 503 | Service Unavailable | External service down |

---

## Examples

### Complete Workflow

```bash
# 1. Calculate irrigation for parcel 5
curl -X POST http://localhost:3004/irrigation/calculate/5

# 2. Get the latest recommendation
curl http://localhost:3004/irrigation/5

# 3. Create a schedule based on the recommendation
curl -X POST http://localhost:3004/irrigation/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "parcel_id": 5,
    "scheduled_time": "2026-04-09T06:00:00Z",
    "water_amount": 25.5,
    "duration": 102,
    "reason": "Auto-generated from calculation"
  }'

# 4. View irrigation history
curl "http://localhost:3004/irrigation/history/5?limit=10"

# 5. Check next scheduled irrigation
curl http://localhost:3004/irrigation/schedule/5

# 6. Execute the schedule
curl -X POST http://localhost:3004/irrigation/schedule/15/execute
```

### Response Time Examples

- Health check: <10ms
- Latest recommendation: 50-100ms
- Calculate (with external calls): 2-5 seconds
- Schedule creation: 50-100ms
- History retrieval: 100-200ms

---

## Rate Limiting

Currently, no rate limiting. Recommended limits:
- Calculations: 10 per minute per parcel
- Schedule creation: 20 per minute
- History queries: 100 per minute

---

## Webhooks (Future)

Planned webhook support for:
- HIGH priority alerts
- Schedule execution completion
- External service failures
