# 🚀 Deployment & Integration Guide

## Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- Docker (for containerized deployment)
- Hugging Face API Key (free account at huggingface.co)

## 1. Local Development Setup

### Step 1: Install Dependencies
```bash
cd disease-detection-service
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```

#### Edit `.env` with your configuration:
```env
PORT=3005
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=terrasens_disease_db
DB_PORT=3306

# Hugging Face API
HUGGING_FACE_API_KEY=hf_YOUR_API_KEY_HERE
HUGGING_FACE_MODEL=neilyo/plant-disease-identification

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Step 3: Setup Database
```bash
npm run migrate
```

This will create:
- `disease_analysis` table
- `analysis_images` table
- `disease_notifications` table

### Step 4: Start Service
```bash
npm start       # Production mode
npm run dev     # Development with nodemon
```

Service will be available at `http://localhost:3005`

## 2. Docker Deployment

### Build Docker Image
```bash
docker build -t disease-detection-service:1.0 .
```

### Run Container
```bash
docker run -d \
  --name disease-detection \
  -p 3005:3005 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  -e DB_HOST=host.docker.internal \
  disease-detection-service:1.0
```

### Docker Compose (Full Stack)
```yaml
version: '3.8'
services:
  disease-detection:
    build: ./disease-detection-service
    ports:
      - '3005:3005'
    environment:
      - DB_HOST=mysql
      - NODE_ENV=development
    env_file:
      - .env
    depends_on:
      - mysql
    volumes:
      - ./disease-detection-service/uploads:/app/uploads

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: terrasens_disease_db
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Deploy:
```bash
docker-compose up -d
```

## 3. API Gateway Integration

### Configure API Gateway Proxy

Edit `api-gateway/src/config/proxy-config.js`:

```javascript
{
  context: '/api/v1/disease',
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/disease': '/api/v1/disease'
  },
  ws: false,
  logLevel: 'debug'
}
```

Or add to `api-gateway/src/server.js`:

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

app.use('/api/v1/disease', createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  logLevel: 'debug'
}));
```

### Test Gateway Integration
```bash
# Through API Gateway
curl -X POST http://localhost:3000/api/v1/disease/analyze \
  -H "Authorization: Bearer {token}" \
  -H "X-User-ID: 1" \
  -F "image=@test.jpg"

# Direct to service
curl -X POST http://localhost:3005/api/v1/disease/analyze \
  -H "Authorization: Bearer {token}" \
  -H "X-User-ID: 1" \
  -F "image=@test.jpg"
```

## 4. Frontend Integration (Angular)

### Step 1: Import Module in AppModule

```typescript
// app.module.ts
import { DiseaseDetectionModule } from './disease-detection/disease-detection.module';

@NgModule({
  imports: [
    // ... other imports
    DiseaseDetectionModule
  ]
})
export class AppModule { }
```

### Step 2: Add Routes

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'disease',
    loadChildren: () => import('./disease-detection/disease-detection.module')
      .then(m => m.DiseaseDetectionModule)
  }
];
```

### Step 3: Configure API URL

```typescript
// environments/environment.ts
export const environment = {
  apiUrl: 'http://localhost:3000', // Via API Gateway
  // or 'http://localhost:3005' for direct access
};
```

### Step 4: Add to Navigation

```html
<!-- navbar component -->
<nav>
  <a routerLink="/disease/upload">Disease Detection</a>
  <a routerLink="/disease/history">Analysis History</a>
</nav>
```

## 5. Production Deployment (Cloud)

### AWS EC2 Deployment

```bash
# 1. SSH into instance
ssh -i key.pem ec2-user@your-instance

# 2. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# 3. Clone repository
git clone <repo-url>
cd disease-detection-service

# 4. Install dependencies
npm install --production

# 5. Configure environment
nano .env

# 6. Run migrations
npm run migrate

# 7. Start with PM2
npm install -g pm2
pm2 start src/server.js --name disease-detection
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.terrasens.com;

    location /api/v1/disease {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for large file uploads
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;

        # File upload limits
        client_max_body_size 5M;
    }

    # Serve uploaded images
    location /uploads {
        alias /app/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Create certificate
sudo certbot certonly --nginx -d api.terrasens.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 6. Database Backup & Migration

### MySQL Backup

```bash
# Full backup
mysqldump -u root -p terrasens_disease_db > backup.sql

# Restore
mysql -u root -p terrasens_disease_db < backup.sql
```

### Migration Scripts

```bash
# Create migration
node scripts/migrate.js

# Rollback (manual - delete tables)
mysql -u root -p terrasens_disease_db -e "DROP TABLE disease_analysis; DROP TABLE analysis_images;"

# Re-run migration
npm run migrate
```

## 7. Monitoring & Logging

### Application Logging

```javascript
// Sentry integration (optional)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.errorHandler());
```

### Health Check Endpoint

```bash
curl http://localhost:3005/health

# Response:
# {"status":"ok","service":"disease-detection-service","timestamp":"2026-04-17T10:00:00Z"}
```

### Logs Monitoring

```bash
# PM2 logs
pm2 logs disease-detection

# Docker logs
docker logs disease-detection

# Tail application logs
tail -f logs/app.log
```

## 8. Performance Optimization

### Image Optimization

Install sharp for image compression:

```bash
npm install sharp
```

Compress images before sending to Hugging Face:

```javascript
const sharp = require('sharp');

const optimized = await sharp(imageBuffer)
  .resize(640, 480, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer();
```

### Database Query Optimization

```javascript
// Use connection pooling (already configured)
// Add indexes
mysql> CREATE INDEX idx_user_created ON disease_analysis(user_id, created_at);
```

### API Response Caching

```javascript
// Cache statistics for 1 hour
const cacheExpiry = 60 * 60 * 1000; // 1 hour
const statsCache = new Map();
```

## 9. Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3005
lsof -i :3005
kill -9 <PID>

# Or use different port
PORT=3006 npm start
```

#### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql
sudo systemctl start mysql

# Verify credentials in .env
mysql -h <host> -u <user> -p<password> <database>
```

#### Hugging Face API Timeout
```bash
# Increase timeout in HuggingFaceService
this.timeout = 60000; // 60 seconds instead of 30
```

#### File Upload Fails
```bash
# Check upload directory exists
mkdir -p uploads/diseases
chmod 755 uploads

# Check file permissions
ls -la uploads/diseases/
```

## 10. Scaling Strategies

### Horizontal Scaling (Multiple Instances)

1. **Load Balancer (HAProxy)**
```
http://lb.example.com
  ├─ disease-detection-1:3005
  ├─ disease-detection-2:3005
  └─ disease-detection-3:3005
```

2. **Database Replication**
   - Master-Slave setup for read replicas
   - Load balance read queries

3. **Image Storage**
   - Use S3 instead of local storage
   - Update ImageUploadHelper to use AWS SDK

### Caching Layer

```bash
npm install redis
```

Implement Redis caching for:
- Disease statistics
- User history (paginated results)
- Recommendation mappings

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run successfully
- [ ] Hugging Face API key valid
- [ ] CORS origins configured correctly
- [ ] File upload directory has proper permissions
- [ ] SSL/HTTPS certificates installed
- [ ] Health check endpoint responds
- [ ] API Gateway proxy configured
- [ ] Frontend environment URLs updated
- [ ] Database backups scheduled
- [ ] Monitoring/logging configured
- [ ] Load testing completed
- [ ] Security audit passed
