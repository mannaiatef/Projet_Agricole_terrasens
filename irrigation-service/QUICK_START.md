# Irrigation Service - Quick Start Guide

## 30-Minute Setup

### 1. Prerequisites
- Node.js 18+
- MySQL 5.7+
- Redis (optional, for async jobs)
- Git

### 2. Clone & Install (2 min)
```bash
cd ~/projects/terrasens
mkdir irrigation-service
cd irrigation-service

npm init -y
npm install express mysql2 dotenv axios bullmq redis node-cron joi nodemon --save
npm install --save-dev jest
```

### 3. Environment Setup (1 min)
```bash
cp .env.example .env

# Edit .env with your local config:
# DB_HOST=localhost
# DB_USER=root (or your MySQL user)
# SERVICE_PORT=3004
# CROP_CALENDAR_SERVICE_URL=http://localhost:3003
# STRESS_SERVICE_URL=http://localhost:3005
```

### 4. Database Init (2 min)
```bash
npm run setup-db

# Output should show:
# ✓ Irrigation Records table verified
# ✓ Irrigation Schedule table verified
# [DB] Database initialization complete
```

### 5. Start Service (1 min)
```bash
npm run dev

# Output:
# ✓ Irrigation Service is running on port 3004
# ✓ Environment: development
# ✓ Queue enabled: true
# ✓ Cron jobs enabled: true
```

### 6. Test Health (1 min)
```bash
curl http://localhost:3004/health

# Response:
# {"status":"ok","service":"irrigation-service","timestamp":"..."}
```

### 7. Calculate Irrigation (5 min)
```bash
# For parcel ID 1 (or use real parcel ID from your crop-calendar-service)
curl -X POST http://localhost:3004/irrigation/calculate/1

# Full response with calculations, conditions, and recommendation
```

---

## Directory Structure

```
irrigation-service/
├── src/
│   ├── app.js                 # Express app entry point
│   ├── config/
│   │   └── db.js             # Database setup & schema
│   ├── controllers/
│   │   └── irrigation.controller.js
│   ├── services/
│   │   ├── external.service.js      # Crop, Stress, Weather services
│   │   └── irrigation.service.js    # Business logic
│   ├── repositories/
│   │   └── irrigation.repository.js # Database operations
│   ├── routes/
│   │   └── irrigation.routes.js
│   ├── jobs/
│   │   ├── irrigation.worker.js     # Queue worker
│   │   └── cron-jobs.js            # Scheduled tasks
│   ├── utils/
│   │   ├── logger.js
│   │   ├── http-client.js
│   │   └── irrigation-calculator.js
│   └── models/
│       └── [future]
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── README.md
├── API_DOCUMENTATION.md
└── QUICK_START.md
```

---

## API Quick Reference

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Service health |
| GET | `/irrigation/:parcelId` | Latest recommendation |
| POST | `/irrigation/calculate/:parcelId` | Calculate now |
| POST | `/irrigation/schedule` | Schedule irrigation |
| GET | `/irrigation/history/:parcelId` | Past records |
| GET | `/irrigation/schedule/:parcelId` | Next scheduled |
| POST | `/irrigation/schedule/:id/execute` | Execute now |

### Example Requests

```bash
# Calculate irrigation for parcel 1
curl -X POST http://localhost:3004/irrigation/calculate/1

# Get latest recommendation
curl http://localhost:3004/irrigation/1

# Schedule irrigation
curl -X POST http://localhost:3004/irrigation/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "parcel_id": 1,
    "scheduled_time": "2026-04-09T06:00:00Z",
    "water_amount": 25,
    "duration": 100,
    "reason": "High stress"
  }'

# Get history (last 30)
curl "http://localhost:3004/irrigation/history/1"

# Get history (last 100)
curl "http://localhost:3004/irrigation/history/1?limit=100"
```

---

## Key Features Explained

### 1. Water Requirement Calculation

**Formula**: ETc = ET0 × Kc

- **ET0**: From weather API (evapotranspiration)
- **Kc**: Crop coefficient (wheat=0.8, maize=0.9, rice=0.8, etc.)
- **Result**: mm of water needed

### 2. Adjustments Applied

1. **Stress Adjustment** (1-1.3x)
   - Low NDVI (<0.4) → More water needed
   - High stress (>50%) → More water needed

2. **Humidity Adjustment** (0.7-1.15x)
   - High humidity (>80%) → Less water needed
   - Low humidity (<40%) → More water needed

3. **Rainfall Forecast**
   - Rain >10mm → Lower priority
   - No rain → Higher priority if stressed

### 3. Priority Levels

- **HIGH**: Stress >50% OR urgent conditions
- **MEDIUM**: Stress 30-50%
- **LOW**: Normal conditions OR rain expected

### 4. Recommended Time

- **6:00 AM**: High temp & low humidity
- **6:30 PM**: Moderate conditions  
- **7:00 AM**: Cool & humid

---

## Debugging

### Check Logs
```bash
# Tail live logs (development mode)
npm run dev

# Search logs for errors
npm run dev 2>&1 | grep ERROR
```

### Common Issues

**"Cannot find service_url"**
→ Check .env file has all URLS set correctly

**"Database connection failed"**
→ Verify MySQL is running and credentials are correct

**"Cannot fetch parcel data"**
→ Ensure crop-calendar-service is running on port 3003

**"Cannot fetch stress data"**
→ Ensure stress-service is running on port 3005

**"Queue not processing"**
→ Verify Redis is running on port 6379

### Enable Debug Logging
```bash
# In .env:
LOG_LEVEL=debug

# Then restart:
npm run dev
```

---

## Development Tips

### Add New Crop Type

Edit `src/utils/irrigation-calculator.js`:

```javascript
const CROP_COEFFICIENTS = {
  // ... existing crops
  soybean: {
    initial: 0.4,
    development: 0.75,
    mid: 1.15,
    late: 0.6,
    default: 0.85,
  },
};
```

### Customize Water Stress Thresholds

Edit `src/utils/irrigation-calculator.js`:

```javascript
function getStressAdjustmentFactor(ndvi, stressPercentage) {
  // Adjust these thresholds
  const ndviAdjustment = ndvi < 0.35 ? 1.25 : ndvi < 0.5 ? 1.1 : 1.0;
  const stressAdjustment = stressPercentage > 60 ? 1.4 : stressPercentage > 25 ? 1.15 : 1.0;
  // ...
}
```

### Change Cron Schedule

Edit `src/jobs/cron-jobs.js`:

```javascript
// Daily at 5:00 AM UTC:
const dailyCalculation = cron.schedule('0 5 * * *', async () => {
  // Change first param to your cron expression
  // '0 3 * * *' = 3:00 AM
  // '0 */6 * * *' = Every 6 hours
});
```

---

## Integration with API Gateway

Update API Gateway config to proxy `/irrigation/*`:

```javascript
// In api-gateway routes
app.use('/irrigation', httpProxy.createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/irrigation': '/irrigation',
  },
}));
```

---

## Production Deployment

### Using Docker
```bash
# Build image
docker build -t terrasens/irrigation-service:1.0 .

# Run container
docker run -d \
  -e DB_HOST=mysql.example.com \
  -e REDIS_HOST=redis.example.com \
  -p 3004:3004 \
  terrasens/irrigation-service:1.0
```

### Using PM2 (Process Manager)
```bash
npm install -g pm2

pm2 start src/app.js --name "irrigation-service" \
  --instances max \
  --env NODE_ENV=production

pm2 save
pm2 startup
```

### Environment Production
```env
NODE_ENV=production
SERVICE_PORT=3004
DB_HOST=mysql.production.com
DB_USER=app_user
DB_PASSWORD=secure_password
REDIS_HOST=redis.production.com
ENABLE_CRON_JOBS=true
LOG_LEVEL=info
```

---

## Monitoring

### Health Check (Continuous)
```bash
watch -n 5 'curl -s http://localhost:3004/health | jq'
```

### Database Queries
```sql
-- Count records by priority
SELECT priority, COUNT(*) as count 
FROM irrigation_records 
GROUP BY priority;

-- Last 10 calculations
SELECT parcel_id, water_amount, priority, created_at 
FROM irrigation_records 
ORDER BY created_at DESC 
LIMIT 10;

-- Pending schedules
SELECT * FROM irrigation_schedule 
WHERE status = 'PENDING' 
ORDER BY scheduled_time ASC;
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Health check response | <10ms |
| Latest recommendation | 50-100ms |
| Calculate (with external) | 2-5s |
| Schedule creation | <100ms |
| History query | 100-200ms |
| Daily batch (1000 parcels) | <60min |

---

## Next Steps

1. ✅ Service running
2. ✅ Database initialized
3. ✅ APIs working
4. → Integrate with API Gateway
5. → Configure monitoring
6. → Setup alerts
7. → Deploy to production

---

## Support

- Check `/logs` directory for detailed logs
- Read `API_DOCUMENTATION.md` for endpoint details
- Review `README.md` for architecture overview
- Check `.env.example` for configuration options

## Quick Commands

```bash
# Start development
npm run dev

# Initialize database
npm run setup-db

# Run production
npm start

# Check health
curl http://localhost:3004/health

# View logs
tail -f logs/*.log

# Stop service
press Ctrl+C
```

Enjoy! 🌾
