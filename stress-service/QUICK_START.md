# Stress Service - Quick Start Guide

## 1. Local Development Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Planet Labs API key

### Step 1: Install Dependencies
```bash
cd stress-service
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration:
# - Set PLANET_API_KEY
# - Configure database connection
# - Set Redis connection details
```

### Step 3: Database Setup
```bash
# Create database (MySQL)
mysql -u root -p
> CREATE DATABASE stress_service_db;
> EXIT;

# Run migrations
npm run migrations
```

### Step 4: Start Services

**Terminal 1 - API Server:**
```bash
npm start
# Server running on http://localhost:3004
```

**Terminal 2 - Background Worker:**
```bash
node src/worker.js
# Worker processing jobs...
```

**Terminal 3 - Verify Health:**
```bash
curl http://localhost:3004/health
```

---

## 2. Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Set Planet API key
export PLANET_API_KEY="your_planet_api_key"

# Start all services (API, Worker, MySQL, Redis)
docker-compose up -d

# Check logs
docker-compose logs -f stress-api
docker-compose logs -f stress-worker

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t stress-service:1.0.0 .

# Create network
docker network create stress-network

# Start MySQL
docker run -d \
  --name stress-mysql \
  --network stress-network \
  -e MYSQL_DATABASE=stress_service_db \
  -e MYSQL_USER=stress_user \
  -e MYSQL_PASSWORD=stress_password \
  -e MYSQL_ROOT_PASSWORD=root_password \
  mysql:8.0

# Run migrations
docker run --rm \
  --network stress-network \
  -e DB_HOST=stress-mysql \
  -e DB_USER=stress_user \
  -e DB_PASSWORD=stress_password \
  -e DB_NAME=stress_service_db \
  stress-service:1.0.0 \
  npm run migrations

# Start API server
docker run -d \
  --name stress-api \
  --network stress-network \
  -p 3004:3004 \
  -e DB_HOST=stress-mysql \
  -e REDIS_HOST=stress-redis \
  -e PLANET_API_KEY=your_key \
  stress-service:1.0.0

# Start worker
docker run -d \
  --name stress-worker \
  --network stress-network \
  -e DB_HOST=stress-mysql \
  -e REDIS_HOST=stress-redis \
  -e PLANET_API_KEY=your_key \
  stress-service:1.0.0 \
  node src/worker.js
```

---

## 3. Testing the Service

### Health Checks

```bash
# Basic health
curl http://localhost:3004/health

# Detailed health
curl http://localhost:3004/health/detailed

# Queue status
curl http://localhost:3004/stress/queue/stats
```

### Analyze a Parcel

```bash
# Trigger analysis (ensure parcel exists in crop-calendar-service)
curl -X POST http://localhost:3004/stress/analyze/1 \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}'

# Response: Watch for "jobId"

# Check job status
curl http://localhost:3004/stress/job/1-1705311000000

# Get results (wait for job to complete)
curl http://localhost:3004/stress/1
```

### Test Bulk Analysis

```bash
curl -X POST http://localhost:3004/stress/bulk-analyze \
  -H "Content-Type: application/json" \
  -d '{"parcelIds": [1, 2, 3, 4, 5]}'
```

---

## 4. Configuration Reference

### Required Environment Variables

```env
# Core
NODE_ENV=production
PORT=3004

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=stress_user
DB_PASSWORD=stress_password
DB_NAME=stress_service_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Planet Labs (Get from https://insights.planet.com/)
PLANET_API_KEY=your_key_here
PLANET_API_BASE_URL=https://api.planet.com/data/v1

# Service Integration
CROP_CALENDAR_SERVICE_URL=http://localhost:3002

# Scheduling
CRON_SCHEDULE=0 2 * * *       # 2 AM daily
STRESS_ALERT_THRESHOLD=30      # Percentage

# Logging
LOG_LEVEL=info
```

### Optional Configuration

```env
# Performance tuning
WORKER_CONCURRENCY=2           # Jobs processing simultaneously
QUEUE_RETRY_ATTEMPTS=3         # Job retry count
PLANET_API_TIMEOUT=30000       # Milliseconds

# Feature flags
ENABLE_ALERTS=true
ENABLE_CRON=true
ENABLE_EMAIL_NOTIFICATIONS=false
```

---

## 5. Database Management

### Check Database Status

```bash
# Connect to MySQL
mysql -h localhost -u stress_user -p stress_service_db

# List tables
SHOW TABLES;

# Check stress records
SELECT * FROM stress_records LIMIT 5;

# Check stress zones
SELECT id, record_id, stress_level, pixel_count FROM stress_zones;

# Check alerts
SELECT * FROM stress_alerts WHERE is_resolved = FALSE;
```

### Backup Database

```bash
mysqldump -h localhost -u stress_user -p stress_service_db > backup.sql
```

### Restore Database

```bash
mysql -h localhost -u stress_user -p stress_service_db < backup.sql
```

---

## 6. Redis Queue Management

### Monitor Queue with Redis CLI

```bash
redis-cli

# Get queue info
HGETALL bull:stress-analysis:1

# List all jobs
KEYS 'bull:stress-analysis:*'

# Flush queue (WARNING: deletes all jobs)
FLUSHALL
```

### Using Redis Commander (Docker)

Access at `http://localhost:8081`

---

## 7. Common Tasks

### Run Migrations Manually

```bash
npm run migrations
```

### Clear All Jobs from Queue

```bash
curl -X DELETE http://localhost:3004/stress/queue/clear
```

### Restart Worker

```bash
# Find process
ps aux | grep worker.js

# Kill
kill <PID>

# Start new
node src/worker.js
```

### View Logs

```bash
# API logs
tail -f logs/combined.log

# Errors only
tail -f logs/error.log

# Follow with grep
tail -f logs/combined.log | grep "ERROR"
```

---

## 8. Troubleshooting

### Port Already in Use

```bash
# Find process using port 3004
lsof -i :3004

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# Verify credentials in .env
cat .env | grep DB_

# Check connection
npm run migrations
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Verify Redis config
cat .env | grep REDIS_
```

### Planet API Issues

```
# Verify API key
echo $PLANET_API_KEY

# Test API connectivity
curl -u <API_KEY>: https://api.planet.com/data/v1/items

# Check Planet Labs dashboard for rate limits and quota
https://insights.planet.com/
```

### No Imagery Found

1. Check parcel polygon coordinates are valid
2. Verify cloud coverage threshold in config
3. Check Planet Labs imagery availability for that region/date
4. Look at logs for Planet API responses

---

## 9. Performance Tuning

### Increase Throughput

```env
# More concurrent workers
WORKER_CONCURRENCY=4

# Increase job retry attempts
QUEUE_RETRY_ATTEMPTS=5

# Reduce stagger delay for bulk jobs
# (Edit scheduler.js - decrease delay)
```

### Optimize Database

```sql
-- Ensure indexes exist
ALTER TABLE stress_records ADD INDEX idx_parcel_id (parcel_id);
ALTER TABLE stress_records ADD INDEX idx_created_at (created_at);
ALTER TABLE stress_zones ADD INDEX idx_record_id (record_id);
ALTER TABLE stress_alerts ADD INDEX idx_parcel_id (parcel_id);
```

### Monitor Performance

```bash
# Check MySQL pool usage
mysql -u stress_user -p stress_service_db -e "SHOW PROCESSLIST;"

# Check Redis memory
redis-cli INFO memory

# Check queue depth
curl http://localhost:3004/stress/queue/stats
```

---

## 10. Production Deployment

### Using Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: stress-service
spec:
  selector:
    app: stress-api
  ports:
    - port: 3004
      targetPort: 3004
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stress-api
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: stress-api
          image: stress-service:1.0.0
          ports:
            - containerPort: 3004
          livenessProbe:
            httpGet:
              path: /health/live
              port: 3004
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3004
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stress-worker
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: stress-worker
          image: stress-service:1.0.0
          command: ["node", "src/worker.js"]
```

### Environment Secrets

```bash
# Create Kubernetes secret
kubectl create secret generic stress-service-secrets \
  --from-literal=PLANET_API_KEY=your_key \
  --from-literal=DB_PASSWORD=secure_password
```

---

## 11. Monitoring & Alerts

### Log Aggregation

Forward logs to ELK, DataDog, or Sumo Logic:

```env
# ElasticSearch endpoint
ELASTICSEARCH_URL=https://logs.example.com
```

### Metrics

Expose Prometheus metrics:

```bash
# Future: Add Prometheus exporter
GET /metrics
```

### Alert Rules

Set up alerts for:
- Job failure rate > 5%
- Queue depth > 100
- Database connection failures
- API response time > 2s

---

## 12. Support & Resources

- **Issues**: Check logs in `logs/` directory
- **API Docs**: See [API_EXAMPLES.md](API_EXAMPLES.md)
- **Architecture**: See [README.md](README.md)
- **Planet Labs**: https://developers.planet.com/
- **BullMQ**: https://docs.bullmq.io/

---

## Next Steps

1. ✅ Start local development server
2. ✅ Test with sample parcel
3. ✅ Deploy to Docker/Kubernetes
4. ✅ Configure cron schedule
5. ✅ Set up webhooks for alerts
6. ✅ Integrate with frontend
7. ✅ Monitor and optimize
