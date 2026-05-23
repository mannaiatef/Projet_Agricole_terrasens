# API Request Examples for Stress Service

## Base URL
http://localhost:3004

---

## 1. GET Latest Analysis

**Request:**
```http
GET /stress/123
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "record": {
      "id": 1,
      "parcel_id": 123,
      "mean_ndvi": 0.4632,
      "stress_percentage": 34.82,
      "pixel_count": 65536,
      "stressed_pixel_count": 22808,
      "status": "completed",
      "imagery_date": "2024-01-15",
      "cloud_coverage": 8.5,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:45:00Z"
    },
    "zones": [
      {
        "id": 1,
        "record_id": 1,
        "geojson": {
          "type": "Polygon",
          "coordinates": [[
            [-75.123, 40.456],
            [-75.124, 40.456],
            [-75.124, 40.457],
            [-75.123, 40.457],
            [-75.123, 40.456]
          ]]
        },
        "stress_level": "high",
        "zone_area": 0.00015,
        "pixel_count": 8250,
        "mean_ndvi_in_zone": 0.245,
        "created_at": "2024-01-15T10:45:00Z"
      }
    ],
    "summary": [
      {
        "stress_level": "high",
        "zone_count": 3,
        "total_area": 0.00045,
        "total_pixels": 24750,
        "avg_ndvi": 0.285
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "error": "No stress analysis found for this parcel"
}
```

---

## 2. POST Trigger Analysis

**Request:**
```http
POST /stress/analyze/123
Content-Type: application/json

{
  "priority": "high"
}
```

**Response (202):**
```json
{
  "success": true,
  "message": "Analysis job queued",
  "jobId": "123-1705311000000",
  "parcelId": 123
}
```

---

## 3. GET Job Status

**Request:**
```http
GET /stress/job/123-1705311000000
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123-1705311000000",
    "name": "analyze-stress",
    "status": "active",
    "progress": 65,
    "attempts": 1,
    "maxAttempts": 3,
    "createdAt": 1705311000000,
    "processedOn": 1705311005000,
    "finishedOn": null
  }
}
```

---

## 4. GET Analysis History

**Request:**
```http
GET /stress/history/123?limit=10
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "parcel_id": 123,
      "mean_ndvi": 0.4632,
      "stress_percentage": 34.82,
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "parcel_id": 123,
      "mean_ndvi": 0.4721,
      "stress_percentage": 31.45,
      "status": "completed",
      "created_at": "2024-01-14T02:15:00Z"
    }
  ],
  "count": 2
}
```

---

## 5. GET Parcel Alerts

**Request:**
```http
GET /stress/alerts/123
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "record_id": 1,
      "parcel_id": 123,
      "alert_type": "high_stress_detected",
      "severity": "high",
      "message": "High vegetation stress detected: 34.82% of parcel affected",
      "is_resolved": false,
      "created_at": "2024-01-15T10:45:00Z",
      "resolved_at": null
    }
  ],
  "statistics": {
    "totalUnresolved": 1,
    "bySeverity": {
      "high": 1,
      "medium": 0,
      "low": 0
    },
    "lastAlert": {
      "id": 1,
      "message": "High vegetation stress detected: 34.82% of parcel affected",
      "created_at": "2024-01-15T10:45:00Z"
    }
  }
}
```

---

## 6. POST Acknowledge Alert

**Request:**
```http
POST /stress/alerts/1/acknowledge
```

**Response (200):**
```json
{
  "success": true,
  "message": "Alert acknowledged"
}
```

---

## 7. GET Queue Statistics

**Request:**
```http
GET /stress/queue/stats
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "waiting": 3,
    "active": 2,
    "completed": 145,
    "failed": 2,
    "paused": 0
  }
}
```

---

## 8. POST Bulk Analysis

**Request:**
```http
POST /stress/bulk-analyze
Content-Type: application/json

{
  "parcelIds": [101, 102, 103, 104, 105]
}
```

**Response (202):**
```json
{
  "success": true,
  "message": "5 analysis jobs queued",
  "jobs": [
    {
      "parcelId": 101,
      "jobId": "101-1705311000000"
    },
    {
      "parcelId": 102,
      "jobId": "102-1705311002000"
    },
    {
      "parcelId": 103,
      "jobId": "103-1705311004000"
    },
    {
      "parcelId": 104,
      "jobId": "104-1705311006000"
    },
    {
      "parcelId": 105,
      "jobId": "105-1705311008000"
    }
  ]
}
```

---

## 9. GET Health Status

**Request:**
```http
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "service": "stress-service",
  "timestamp": "2024-01-15T10:50:00Z"
}
```

---

## 10. GET Detailed Health

**Request:**
```http
GET /health/detailed
```

**Response (200):**
```json
{
  "status": "healthy",
  "service": "stress-service",
  "timestamp": "2024-01-15T10:50:00Z",
  "components": {
    "database": {
      "status": "connected"
    },
    "queue": {
      "status": "operational",
      "stats": {
        "waiting": 3,
        "active": 2,
        "completed": 145,
        "failed": 2,
        "paused": 0
      }
    },
    "scheduler": {
      "status": "active",
      "tasks": 2
    }
  }
}
```

---

## 11. GET Kubernetes Readiness Probe

**Request:**
```http
GET /health/ready
```

**Response (200):**
```json
{
  "ready": true,
  "message": "Service ready to accept traffic"
}
```

---

## 12. GET Kubernetes Liveness Probe

**Request:**
```http
GET /health/live
```

**Response (200):**
```json
{
  "alive": true,
  "uptime": 3600.45
}
```

---

## Error Response Examples

### 400 Bad Request
```json
{
  "error": "parcelId is required"
}
```

### 404 Not Found
```json
{
  "error": "Job not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to retrieve analysis",
  "message": "Database connection timeout"
}
```

### 503 Service Unavailable (Readiness)
```json
{
  "ready": false,
  "message": "Database not connected"
}
```

---

## cURL Examples

```bash
# Get latest analysis
curl http://localhost:3004/stress/123

# Trigger analysis
curl -X POST http://localhost:3004/stress/analyze/123 \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}'

# Get job status
curl http://localhost:3004/stress/job/123-1705311000000

# Get alerts
curl http://localhost:3004/stress/alerts/123

# Acknowledge alert
curl -X POST http://localhost:3004/stress/alerts/1/acknowledge

# Bulk analysis
curl -X POST http://localhost:3004/stress/bulk-analyze \
  -H "Content-Type: application/json" \
  -d '{"parcelIds": [101, 102, 103]}'

# Queue stats
curl http://localhost:3004/stress/queue/stats

# Health check
curl http://localhost:3004/health

# Detailed health
curl http://localhost:3004/health/detailed
```

---

## Integration with Other Services

### From API Gateway

Route requests to stress-service:

```javascript
app.use('/stress', proxy('http://stress-api:3004'));
```

### From Frontend

```javascript
// Fetch latest analysis
const response = await fetch('http://api-gateway/stress/123');
const analysis = await response.json();

// Trigger analysis
await fetch('http://api-gateway/stress/analyze/123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priority: 'high' })
});

// Subscribe to job updates (via polling)
const pollJob = setInterval(async () => {
  const status = await fetch('http://api-gateway/stress/job/job-id');
  const data = await status.json();
  
  if (data.data.status === 'completed') {
    clearInterval(pollJob);
    // Job complete - refresh analysis
  }
}, 5000);
```

---

## Performance Metrics

Typical response times (on local machine):

| Endpoint | Time |
|----------|------|
| GET /stress/:id | 50-100ms |
| GET /health | 5-10ms |
| POST /analyze/:id | 50-100ms |
| GET /queue/stats | 20-50ms |
| GET /alerts/:id | 100-200ms |

Job analysis turnaround:
- Queue wait: 0-60 seconds (depends on queue depth)
- Processing: 30-60 seconds (satellite imagery retrieval and NDVI computation)
- Total: 30-120 seconds

---

## Pagination & Filtering

Future enhancements:

```http
GET /stress/history/123?limit=10&offset=0&status=completed&from=2024-01-01&to=2024-01-31
```
