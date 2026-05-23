# Integration Guide - Stress Service with Existing System

## Overview

The stress-service integrates with:
- **API Gateway** - Route requests to stress endpoints
- **Auth Service** - Validate user permissions
- **Crop Calendar Service** - Fetch parcel data
- **Frontend** - Display stress analysis results

## Integration Steps

### 1. API Gateway Configuration

Add routes to forward stress-service requests:

```javascript
// api-gateway/src/routes/proxy.js or similar

const router = express.Router();
const proxy = require('express-http-proxy');

// Map /stress/* routes to stress-service
router.use('/stress', proxy('http://stress-service:3004', {
  proxyReqPathResolver: (req) => {
    return `/stress${req.originalUrl.substring(1)}`;
  },
  
  // Pass auth token to stress-service
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Authorization'] = srcReq.headers.authorization;
    return proxyReqOpts;
  }
}));

// Map health endpoint
router.use('/health/stress', proxy('http://stress-service:3004', {
  proxyReqPathResolver: (req) => '/health'
}));

module.exports = router;
```

Then in main app:

```javascript
const stressProxyRoutes = require('./routes/stress-proxy');
app.use('/', stressProxyRoutes);
```

### 2. Auth Service Integration

Add middleware to validate stress-service requests:

```javascript
// stress-service/src/middlewares/auth.js

const axios = require('axios');
const logger = require('../utils/logger');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

async function validateToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token' });
    }

    // Validate with auth service
    const response = await axios.get(`${AUTH_SERVICE_URL}/validate`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });

    req.user = response.data.user;
    next();
  } catch (error) {
    logger.warn('Token validation failed', { message: error.message });
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { validateToken };
```

Add to routes:

```javascript
// stress-service/src/routes/stress.js

const { validateToken } = require('../middlewares/auth');

// Apply auth middleware (optional - configure as needed)
router.use(validateToken);

// Or per-route:
router.post('/analyze/:parcelId', validateToken, StressController.triggerAnalysis);
```

### 3. Crop Calendar Service Integration

Already integrated via `CropCalendarClient.js`

Ensure endpoint is correct in `.env`:

```env
CROP_CALENDAR_SERVICE_URL=http://crop-calendar-service:3002
```

Test connection:

```bash
curl http://crop-calendar-service:3002/parcelles/1
```

### 4. Frontend Integration

#### Angular Service

```typescript
// frontend/src/app/services/stress.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, of } from 'rxjs';
import { switchMap, startWith, takeWhile, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StressService {
  private apiUrl = '/api/stress';

  constructor(private http: HttpClient) {}

  /**
   * Get latest stress analysis for parcel
   */
  getLatestAnalysis(parcelId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${parcelId}`);
  }

  /**
   * Trigger new analysis
   */
  triggerAnalysis(parcelId: number, priority: string = 'normal'): Observable<any> {
    return this.http.post(`${this.apiUrl}/analyze/${parcelId}`, { priority });
  }

  /**
   * Poll job status until completion
   */
  pollJobStatus(jobId: string): Observable<any> {
    return interval(3000).pipe(
      startWith(0),
      switchMap(() => this.getJobStatus(jobId)),
      takeWhile(job => job.data.status !== 'completed', true),
      retry(3)
    );
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/job/${jobId}`);
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(parcelId: number, limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${parcelId}?limit=${limit}`);
  }

  /**
   * Get parcel alerts
   */
  getParcelAlerts(parcelId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/alerts/${parcelId}`);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {});
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/queue/stats`);
  }
}
```

#### Component Example

```typescript
// frontend/src/app/components/parcel-stress/parcel-stress.component.ts

import { Component, OnInit, Input } from '@angular/core';
import { StressService } from '../../services/stress.service';

@Component({
  selector: 'app-parcel-stress',
  templateUrl: './parcel-stress.component.html',
  styleUrls: ['./parcel-stress.component.css']
})
export class ParcelStressComponent implements OnInit {
  @Input() parcelId: number;

  analysis: any = null;
  alerts: any[] = [];
  loading = false;
  analyzing = false;
  jobId: string = null;

  constructor(private stressService: StressService) {}

  ngOnInit() {
    this.loadLatestAnalysis();
    this.loadAlerts();
  }

  /**
   * Load latest analysis
   */
  loadLatestAnalysis() {
    this.loading = true;
    this.stressService.getLatestAnalysis(this.parcelId).subscribe({
      next: (data) => {
        this.analysis = data.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load analysis', err);
        this.loading = false;
      }
    });
  }

  /**
   * Trigger new analysis
   */
  triggerAnalysis() {
    this.analyzing = true;
    this.stressService.triggerAnalysis(this.parcelId, 'high').subscribe({
      next: (data) => {
        this.jobId = data.jobId;
        this.pollJobCompletion();
      },
      error: (err) => {
        console.error('Failed to trigger analysis', err);
        this.analyzing = false;
      }
    });
  }

  /**
   * Poll job status
   */
  pollJobCompletion() {
    this.stressService.pollJobStatus(this.jobId).subscribe({
      next: (data) => {
        if (data.data.status === 'completed') {
          this.analyzing = false;
          this.loadLatestAnalysis();
        }
      },
      error: (err) => {
        console.error('Job polling error', err);
        this.analyzing = false;
      }
    });
  }

  /**
   * Load alerts
   */
  loadAlerts() {
    this.stressService.getParcelAlerts(this.parcelId).subscribe({
      next: (data) => {
        this.alerts = data.data;
      },
      error: (err) => console.error('Failed to load alerts', err)
    });
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: number) {
    this.stressService.acknowledgeAlert(alertId).subscribe({
      next: () => {
        this.alerts = this.alerts.filter(a => a.id !== alertId);
      },
      error: (err) => console.error('Failed to acknowledge alert', err)
    });
  }

  /**
   * Get stress status string
   */
  getStressStatus(): string {
    if (!this.analysis) return 'No data';
    
    const stress = this.analysis.record.stress_percentage;
    if (stress < 20) return 'Healthy';
    if (stress < 40) return 'Moderate Stress';
    if (stress < 60) return 'High Stress';
    return 'Critical Stress';
  }

  /**
   * Get stress color
   */
  getStressColor(): string {
    if (!this.analysis) return '#999';
    
    const stress = this.analysis.record.stress_percentage;
    if (stress < 20) return '#4CAF50'; // Green
    if (stress < 40) return '#FFC107'; // Amber
    if (stress < 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }
}
```

#### Template Example

```html
<!-- frontend/src/app/components/parcel-stress/parcel-stress.component.html -->

<div class="stress-analysis-card">
  <h3>Vegetation Stress Analysis</h3>

  <div *ngIf="loading" class="loading">
    <p>Loading analysis...</p>
  </div>

  <div *ngIf="analysis && !loading" class="analysis-results">
    <!-- Stress Level Indicator -->
    <div class="stress-indicator" [style.backgroundColor]="getStressColor()">
      <div class="stress-percentage">
        {{ analysis.record.stress_percentage | number:'1.1-1' }}%
      </div>
      <div class="stress-status">
        {{ getStressStatus() }}
      </div>
    </div>

    <!-- NDVI Value -->
    <div class="metric">
      <span class="label">Mean NDVI:</span>
      <span class="value">{{ analysis.record.mean_ndvi | number:'1.2-4' }}</span>
    </div>

    <!-- Analysis Date -->
    <div class="metric">
      <span class="label">Analysis Date:</span>
      <span class="value">{{ analysis.record.created_at | date:'short' }}</span>
    </div>

    <!-- Stress Zones -->
    <div *ngIf="analysis.zones && analysis.zones.length > 0" class="zones">
      <h4>Stress Zones</h4>
      <div class="zone-list">
        <div *ngFor="let zone of analysis.zones" class="zone-item">
          <span class="level" [class]="'level-' + zone.stress_level">
            {{ zone.stress_level | uppercase }}
          </span>
          <span>{{ zone.pixel_count }} pixels</span>
          <span>NDVI: {{ zone.mean_ndvi_in_zone | number:'1.2-4' }}</span>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div *ngIf="alerts && alerts.length > 0" class="alerts">
      <h4>Active Alerts</h4>
      <div *ngFor="let alert of alerts" class="alert-item" [class]="'severity-' + alert.severity">
        <span class="message">{{ alert.message }}</span>
        <button (click)="acknowledgeAlert(alert.id)" class="btn-small">
          Dismiss
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="actions">
      <button 
        (click)="triggerAnalysis()" 
        [disabled]="analyzing"
        class="btn btn-primary">
        {{ analyzing ? 'Analyzing...' : 'Re-analyze' }}
      </button>
    </div>
  </div>
</div>
```

#### Styles

```css
/* frontend/src/app/components/parcel-stress/parcel-stress.component.css */

.stress-analysis-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
  background: white;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stress-indicator {
  border-radius: 8px;
  padding: 20px;
  color: white;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.stress-percentage {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stress-status {
  font-size: 14px;
  opacity: 0.9;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.metric .label {
  font-weight: 600;
  color: #333;
}

.metric .value {
  color: #666;
}

.level-high {
  background-color: #F44336;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.level-medium {
  background-color: #FF9800;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.level-healthy {
  background-color: #4CAF50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.zones, .alerts {
  margin-top: 10px;
}

.zones h4, .alerts h4 {
  margin-top: 0;
  color: #333;
}

.zone-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}

.alert-item {
  padding: 10px;
  margin-bottom: 8px;
  border-left: 4px solid;
  border-radius: 4px;
  background-color: #f9f9f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-item.severity-high {
  border-color: #F44336;
  background-color: #FFEBEE;
}

.alert-item.severity-medium {
  border-color: #FF9800;
  background-color: #FFF3E0;
}

.alert-item .message {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #2196F3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1976D2;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.btn-small:hover {
  background-color: #e0e0e0;
}
```

## Database Connection String

For docker-compose setup:

```
MySQL: mysql://stress_user:stress_password@stress-mysql:3306/stress_service_db
Redis: redis://stress-redis:6379
```

## Network Configuration

For Docker Compose to work across services:

```yaml
networks:
  - terrasens-network  # Shared network with other services
```

## Monitoring Dashboard

Optional: Add Prometheus metrics endpoint

```typescript
// stress-service/src/routes/metrics.js

GET /metrics
```

Returns:
- Job processing time
- Analysis success rate
- Queue depth
- API latency

## Webhook Integration

For external notifications:

```env
WEBHOOK_URL=https://your-service.com/webhooks/stress
WEBHOOK_SECRET=your_secret_key
```

## Testing Integration

```bash
# Test parcel exists
curl http://localhost:3002/parcelles/1

# Test analysis
curl -X POST http://localhost:3004/stress/analyze/1 \
  -H "Content-Type: application/json" \
  -d '{"priority": "high"}'

# Check results
curl http://localhost:3004/stress/1

# Through API Gateway
curl http://localhost:3000/stress/1
```

## Troubleshooting Integration

**Service not found from gateway**
- Ensure stress-service DNS resolves correctly
- Check Docker network connectivity
- Verify service is running: `docker ps`

**Database connection from stress-service**
- Ensure MySQL container is running
- Check credentials in .env
- Run migrations: `npm run migrations`

**Crop calendar data not loading**
- Verify crop-calendar-service URL in .env
- Test endpoint: `curl CROP_CALENDAR_SERVICE_URL/parcelles/1`
- Check if parcel exists in crop service

**Frontend component not showing**
- Verify API Gateway proxy configuration
- Check browser network tab for errors
- Ensure stressService is injected in component
