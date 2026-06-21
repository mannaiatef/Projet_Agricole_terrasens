# Sentinel Hub Image Visualization - Integration Checklist

## Pre-Integration Setup

### 1. Backend Configuration
- [ ] Get Sentinel Hub credentials from https://dataspace.copernicus.eu/
- [ ] Add credentials to `.env` file:
  ```env
  SENTINEL_HUB_CLIENT_ID=your_client_id_here
  SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here
  ```
- [ ] Install axios if not already installed: `npm install axios`
- [ ] Verify database has field/parcel geometry data (GeoJSON polygon)
- [ ] Test connectivity: `npm run dev` in stress-service

### 2. Frontend Configuration
- [ ] Verify Angular 19+ is installed
- [ ] Check environment files are configured correctly
- [ ] Ensure HttpClient is provided in app config

### 3. Database Check
- [ ] Run query to verify field data exists:
  ```sql
  SELECT id, name, polygon FROM parcels LIMIT 5;
  ```
- [ ] Ensure `polygon` column contains valid GeoJSON
- [ ] Check field has valid latitude/longitude

## Backend Integration

### Step 1: Copy Backend Files
- [ ] Copy `src/services/SentinelHubService.js` to stress-service
- [ ] Copy `src/controllers/SentinelHubController.js` to stress-service
- [ ] Update `src/routes/stress.js` to include Sentinel Hub routes

### Step 2: Verify Routes
```bash
# Test the routes are registered
curl -X GET "http://localhost:3000/api/stress/sentinel/legend"
```

Expected response: NDVI legend JSON

### Step 3: Test Endpoints

```bash
# Test image retrieval (replace 1 with valid field ID)
curl -X GET "http://localhost:3000/api/stress/sentinel/image/1?imageType=NDVI" \
  -H "Authorization: Bearer your_token" \
  --output test-image.png

# Test metadata
curl -X GET "http://localhost:3000/api/stress/sentinel/image/1/metadata" \
  -H "Authorization: Bearer your_token"

# Test field info
curl -X GET "http://localhost:3000/api/stress/sentinel/field/1/info" \
  -H "Authorization: Bearer your_token"
```

## Frontend Integration

### Step 1: Copy Frontend Files
- [ ] Copy `src/app/models/sentinel-hub.model.ts`
- [ ] Copy `src/app/services/sentinel-hub.service.ts`
- [ ] Copy `src/app/components/sentinel-image-viewer/` directory (all files)

### Step 2: Update Environment Files
- [ ] Update `src/environments/environment.ts`
- [ ] Update `src/environments/environment.prod.ts`

Verify configuration includes:
```typescript
sentinelHub: {
  baseUrl: 'http://localhost:3000/api/stress/sentinel',
  getImage: '/image/:fieldId',
  getImageMetadata: '/image/:fieldId/metadata',
  getFieldInfo: '/field/:fieldId/info',
  getNDVILegend: '/legend',
  downloadImage: '/download/:fieldId'
}
```

### Step 3: Import Component

In your page/component where you want to use the viewer:

```typescript
import { SentinelImageViewerComponent } from './components/sentinel-image-viewer/sentinel-image-viewer.component';

@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [SentinelImageViewerComponent],
  template: `
    <app-sentinel-image-viewer [fieldId]="fieldId"></app-sentinel-image-viewer>
  `
})
export class FieldDetailComponent {
  fieldId = 1; // Replace with actual field ID
}
```

### Step 4: Add to Navigation (Optional)

Add link to satellite image viewer in your main navigation:

```typescript
// In your app.routes.ts or routing module
{
  path: 'fields/:id/satellite',
  component: SentinelImageViewerPageComponent
}
```

## Testing

### Backend Tests
- [ ] Image endpoint returns PNG blob
- [ ] Metadata endpoint returns valid JSON
- [ ] Legend endpoint returns valid legend data
- [ ] Download endpoint sets correct headers
- [ ] Error handling works for invalid field IDs
- [ ] Error handling works for missing credentials

### Frontend Tests
- [ ] Component loads without errors
- [ ] Image displays when fieldId is provided
- [ ] Image type switching works (NDVI, TrueColor, Moisture)
- [ ] Zoom functionality works (scroll wheel)
- [ ] Pan functionality works (drag when zoomed)
- [ ] Refresh button reloads image
- [ ] Download button downloads image
- [ ] Legend displays correctly for NDVI
- [ ] Loading spinner shows during loading
- [ ] Error messages display properly
- [ ] Field information displays correctly
- [ ] Mobile responsive layout works
- [ ] Component cleans up on destroy

### Integration Tests
```bash
# Start backend
cd stress-service
npm run dev

# In another terminal, start frontend
cd frontend
ng serve

# Open browser and navigate to component
# http://localhost:4200/path-to-component
```

## Performance Optimization

### Backend
- [ ] Image generation completes within 30 seconds
- [ ] Token caching works (reuse within expiration)
- [ ] Database queries for field geometry are fast
- [ ] Memory usage is acceptable for concurrent requests

### Frontend
- [ ] Component renders without jank
- [ ] Zoom is smooth (60 fps)
- [ ] Image loading shows spinner (no blank state)
- [ ] Component doesn't leak memory on destroy

## Security Checklist

- [ ] Sentinel Hub credentials are in .env (never committed)
- [ ] Frontend never stores API keys directly
- [ ] All API calls go through secure backend
- [ ] User authentication is required for endpoints
- [ ] User can only access fields they have permission for
- [ ] CORS is properly configured
- [ ] HTTPS is enforced in production
- [ ] Rate limiting is implemented on image endpoints

## Troubleshooting Guide

### Backend Issues

**Error: "Failed to authenticate with Sentinel Hub"**
- [ ] Check SENTINEL_HUB_CLIENT_ID is set
- [ ] Check SENTINEL_HUB_CLIENT_SECRET is set
- [ ] Verify credentials are valid on Copernicus website
- [ ] Check internet connectivity

**Error: "No suitable satellite imagery found"**
- [ ] Verify field geometry is valid GeoJSON
- [ ] Check field is in Sentinel-2 coverage area
- [ ] Expand date range in search
- [ ] Try different image type

**Error: "Field not found"**
- [ ] Check field ID is valid
- [ ] Query database to verify field exists
- [ ] Check polygon column is not NULL

### Frontend Issues

**Image doesn't load**
- [ ] Check browser console for errors
- [ ] Verify fieldId is correct
- [ ] Check network tab for API requests
- [ ] Verify backend is running
- [ ] Check authentication token is valid

**Styling looks broken**
- [ ] Clear browser cache
- [ ] Rebuild CSS: `ng build`
- [ ] Check SCSS compilation errors
- [ ] Verify viewport meta tag in HTML

**Zoom doesn't work**
- [ ] Check mouse wheel event listener
- [ ] Verify browser supports wheel events
- [ ] Check z-index conflicts with other elements

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation is up to date
- [ ] Environment variables are documented

### Production Deployment
- [ ] Update environment.prod.ts with production URLs
- [ ] Set Sentinel Hub credentials in production environment
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set up error logging and monitoring
- [ ] Set up performance monitoring
- [ ] Configure backup and disaster recovery

### Post-Deployment
- [ ] Test all endpoints in production
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Monitor Sentinel Hub API rate limits

## Documentation

- [ ] README.md is complete
- [ ] API endpoints are documented
- [ ] Code comments explain complex logic
- [ ] Example integration code is provided
- [ ] Troubleshooting guide is comprehensive
- [ ] Setup instructions are clear

## Future Enhancements

- [ ] Add time-series analysis
- [ ] Add multi-temporal comparison
- [ ] Add custom evaluation scripts
- [ ] Add precipitation data overlay
- [ ] Add weather forecast overlay
- [ ] Add disease risk prediction
- [ ] Add bulk download capability
- [ ] Add API for custom integrations

## Support Contacts

- **Sentinel Hub Issues:** https://support.sentinel-hub.com/
- **Copernicus Issues:** https://support.dataspace.copernicus.eu/
- **Platform Issues:** [Your support contact]

## Sign-Off

- [ ] Backend Developer: _________________ Date: _______
- [ ] Frontend Developer: _________________ Date: _______
- [ ] QA/Tester: _________________ Date: _______
- [ ] Project Manager: _________________ Date: _______

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Status:** Complete & Ready for Integration
