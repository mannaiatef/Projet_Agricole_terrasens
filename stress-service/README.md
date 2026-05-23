# Stress Service - Smart Agriculture Vegetation Stress Detection

Production-ready microservice for detecting vegetation stress using satellite imagery from Planet Labs API.

## Features

✅ **Parcel Integration** - Fetch parcel data from crop-calendar-service  
✅ **Satellite Imagery** - Planet Labs API integration with smart filtering  
✅ **NDVI Computation** - Accurate NDVI calculation from NIR and Red bands  
✅ **Stress Detection** - Classify vegetation health into stress levels  
✅ **GeoJSON Zones** - Convert stress pixels to geographic polygons  
✅ **Database Storage** - MySQL schema for results and zones  
✅ **REST APIs** - Clean endpoints for analysis and monitoring  
✅ **Background Processing** - BullMQ job queue with Redis  
✅ **Cron Scheduling** - Automated daily analysis of all parcels  
✅ **Alert System** - High-stress notifications and tracking  
✅ **Health Checks** - Kubernetes-ready probes

## Architecture

```
stress-service/
├── src/
│   ├── app.js                 # Express server
│   ├── worker.js              # Background job worker
│   ├── config/
│   │   └── database.js        # MySQL connection pool
│   ├── controllers/
│   │   ├── StressController.js
│   │   └── HealthController.js
│   ├── services/
│   │   ├── StressAnalysisService.js    # Main orchestrator
│   │   ├── PlanetLabsClient.js         # Satellite API
│   │   ├── NDVIService.js              # NDVI computation
│   │   ├── GeoJSONService.js           # Spatial analysis
│   │   ├── CropCalendarClient.js       # Parcel data
│   │   └── AlertService.js             # Alert handling
│   ├── repositories/
│   │   ├── StressRecordRepository.js
│   │   ├── StressZoneRepository.js
│   │   └── AlertRepository.js
│   ├── jobs/
│   │   ├── queue.js                    # BullMQ queue setup
│   │   ├── scheduler.js                # Cron jobs
│   │   └── workers/
│   │       └── StressAnalysisWorker.js
│   ├── routes/
│   │   ├── stress.js
│   │   └── health.js
│   ├── utils/
│   │   └── logger.js
│   └── middlewares/
├── db/
│   └── migrations.js          # Database schema
├── Dockerfile
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Planet Labs API key

### Setup

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Configure .env with your values:
# - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# - REDIS_HOST, REDIS_PORT
# - PLANET_API_KEY
# - CROP_CALENDAR_SERVICE_URL

# Run database migrations
npm run migrations

# Start API server (port 3004)
npm start

# In another terminal, start worker (job processing)
node src/worker.js

# Development mode (with hot reload)
npm run dev
```

## API Endpoints

### Analysis

**Get Latest Analysis**
```http
GET /stress/:parcelId
```
Returns latest completed stress analysis for a parcel.

Response:
```json
{
  "success": true,
  "data": {
    "record": {
      "id": 1,
      "parcel_id": 123,
      "mean_ndvi": 0.45,
      "stress_percentage": 35.2,
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "zones": [
      {
        "id": 1,
        "stress_level": "high",
        "geojson": {...},
        "pixel_count": 1245
      }
    ]
  }
}
```

**Trigger Analysis**
```http
POST /stress/analyze/:parcelId
Content-Type: application/json

{
  "priority": "high"
}
```

Response:
```json
{
  "success": true,
  "message": "Analysis job queued",
  "jobId": "123-1705311000000"
}
```

**Get Analysis History**
```http
GET /stress/history/:parcelId?limit=50
```

**Get Job Status**
```http
GET /stress/job/:jobId
```

### Alerts

**Get Parcel Alerts**
```http
GET /stress/alerts/:parcelId
```

**Acknowledge Alert**
```http
POST /stress/alerts/:alertId/acknowledge
```

### Queue & System

**Get Queue Statistics**
```http
GET /stress/queue/stats
```

**Bulk Analysis**
```http
POST /stress/bulk-analyze
Content-Type: application/json

{
  "parcelIds": [1, 2, 3, 4, 5]
}
```

### Health

**Basic Health Check**
```http
GET /health
```

**Detailed Health**
```http
GET /health/detailed
```

**Kubernetes Probes**
```http
GET /health/ready    # Readiness
GET /health/live     # Liveness
```

## Database Schema

### stress_records
```sql
- id (PK)
- parcel_id
- mean_ndvi (0.0-1.0)
- stress_percentage (0-100)
- pixel_count
- stressed_pixel_count
- status (pending|processing|completed|failed)
- error_message
- imagery_date
- cloud_coverage
- created_at
- updated_at
```

### stress_zones
```sql
- id (PK)
- record_id (FK)
- geojson (GeoJSON Polygon)
- stress_level (high|medium|healthy)
- zone_area
- pixel_count
- mean_ndvi_in_zone
- created_at
```

### stress_alerts
```sql
- id (PK)
- record_id (FK)
- parcel_id
- alert_type
- severity (low|medium|high)
- message
- is_resolved
- created_at
- resolved_at
```

## Configuration

### Environment Variables

```env
# Server
PORT=3004
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=stress_service_db

# Redis (for Job Queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Planet Labs
PLANET_API_KEY=your_key_here
PLANET_API_BASE_URL=https://api.planet.com/data/v1

# Crop Calendar Service
CROP_CALENDAR_SERVICE_URL=http://localhost:3002

# Scheduler
CRON_SCHEDULE=0 2 * * *   # 2 AM daily
STRESS_ALERT_THRESHOLD=30 # Percentage to trigger alert
```

## NDVI Computation

NDVI (Normalized Difference Vegetation Index) formula:
```
NDVI = (NIR - Red) / (NIR + Red)
```

### Stress Classification

| NDVI Range | Classification | Severity |
|-----------|----------------|----------|
| < 0.3     | HIGH stress    | Critical |
| 0.3 - 0.5 | MEDIUM stress  | Warning  |
| > 0.5     | HEALTHY        | OK       |

## Job Processing

The service uses BullMQ for asynchronous job processing:

- **Queue**: `stress-analysis`
- **Worker**: Processes 2 jobs concurrently
- **Retry**: 3 attempts with exponential backoff
- **Job Flow**:
  1. Job added to queue
  2. Worker picks up job
  3. Fetch parcel data
  4. Search satellite imagery
  5. Download bands
  6. Compute NDVI
  7. Detect stress zones
  8. Store results
  9. Create alerts if needed

Monitor queue:
```bash
GET /stress/queue/stats
```

## Scheduling

Daily cron job (configurable via `CRON_SCHEDULE`):
- Fetches all parcels
- Queues each for analysis
- Staggered processing to avoid overload

Queue cleanup runs every 6 hours to maintain performance.

## Alerts

Automatic alerts trigger when:
- Stress percentage > threshold (default 30%)
- High stress level detected (NDVI < 0.3)

Alert properties:
```json
{
  "parcelId": 123,
  "severity": "high",
  "stressPercentage": 45.2,
  "message": "High vegetation stress detected"
}
```

## Docker Deployment

### Build

```bash
docker build -t stress-service:1.0.0 .
```

### Run (API Server)

```bash
docker run -d \
  --name stress-api \
  -p 3004:3004 \
  -e DB_HOST=mysql \
  -e REDIS_HOST=redis \
  -e PLANET_API_KEY=xxx \
  stress-service:1.0.0
```

### Run (Worker)

```bash
docker run -d \
  --name stress-worker \
  -e DB_HOST=mysql \
  -e REDIS_HOST=redis \
  -e PLANET_API_KEY=xxx \
  stress-service:1.0.0 \
  node src/worker.js
```

### Docker Compose

```yaml
version: '3.8'

services:
  stress-api:
    image: stress-service:1.0.0
    ports:
      - "3004:3004"
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - PLANET_API_KEY=${PLANET_API_KEY}
    depends_on:
      - mysql
      - redis

  stress-worker:
    image: stress-service:1.0.0
    command: node src/worker.js
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - PLANET_API_KEY=${PLANET_API_KEY}
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=stress_service_db

  redis:
    image: redis:7-alpine
```

## Error Handling

The service implements comprehensive error handling:

- **API Errors**: Return appropriate HTTP status codes
- **Database Errors**: Logged and retried
- **Planet API Errors**: Automatic retry with exponential backoff
- **Job Failures**: Retried up to 3 times
- **Alert Errors**: Non-critical, don't block processing

## Logging

Logging via Winston:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only
- Console output with color coding

Log level from `LOG_LEVEL` env var (default: `info`)

## Performance Optimization

- **Connection Pooling**: MySQL pool with 10 connections
- **Concurrent Workers**: 2 jobs processing simultaneously
- **Job Staggering**: Automatic delay between bulk jobs
- **Asset Retry**: 3 attempts with 5 second delays
- **Query Indexes**: Parcel ID, status, created_at

## Security

- Environment variables for secrets
- No API keys in code/logs
- Input validation on all endpoints
- SQL parameterized queries (protection against injection)
- CORS enabled for cross-origin requests

## Monitoring

### Health Checks

```bash
curl http://localhost:3004/health
curl http://localhost:3004/health/detailed
curl http://localhost:3004/health/ready       # Kubernetes readiness
curl http://localhost:3004/health/live        # Kubernetes liveness
```

### Queue Monitoring

```bash
curl http://localhost:3004/stress/queue/stats
```

### Logs

```bash
tail -f logs/combined.log
tail -f logs/error.log
```

## Troubleshooting

**No imagery found**
- Check Planet API key validity
- Verify parcel polygon coordinates
- Check cloud coverage threshold

**NDVI values zero**
- Verify NIR and Red bands are downloading correctly
- Check band data type configuration
- Ensure imagery has required bands

**Database connection failed**
- Verify MySQL is running
- Check credentials in .env
- Ensure database and tables are created

**Job queue backed up**
- Increase worker concurrency
- Check Planet API rate limits
- Reduce imagery resolution

## Performance Characteristics

- Single parcel analysis: ~30-60 seconds (depends on imagery availability)
- NDVI computation: ~5 seconds (256x256 pixels)
- GeoJSON zone generation: ~2 seconds
- Database storage: ~1 second

## Development

```bash
# Watch mode with auto-reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## License

MIT
