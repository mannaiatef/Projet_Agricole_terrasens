# Sentinel Hub Image Visualization Feature

Complete implementation for retrieving and displaying satellite images from Sentinel Hub Process API in the TerraSens agricultural monitoring platform.

## Overview

This feature enables users to:
- View NDVI (Normalized Difference Vegetation Index) satellite images for fields
- Switch between different visualization types (NDVI, True Color, Moisture)
- Zoom and pan across images
- Download satellite images
- View vegetation health color scale legend
- Access field metadata and acquisition dates

## Architecture

### Backend (Express.js - stress-service)

**Key Components:**
- `SentinelHubService.js` - Core Sentinel Hub API integration
- `SentinelHubController.js` - REST endpoint handlers
- Routes in `stress.js` - API endpoints

**Technology Stack:**
- Node.js with Express
- Axios for HTTP requests
- MySQL for database
- Environment variables for secure credentials

### Frontend (Angular 19)

**Key Components:**
- `SentinelHubService` - Data service for API calls
- `SentinelImageViewerComponent` - Reusable UI component
- `sentinel-hub.model.ts` - TypeScript interfaces
- SCSS with glassmorphism design

## Setup Instructions

### Backend Setup

1. **Install Dependencies** (if not already installed):
```bash
cd stress-service
npm install axios
```

2. **Environment Variables** (.env file in stress-service):
```env
# Sentinel Hub Credentials (Copernicus Data Space Ecosystem)
SENTINEL_HUB_CLIENT_ID=your_client_id_here
SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stress_service_db
DB_PORT=3306
```

3. **Get Sentinel Hub Credentials:**
   - Visit: https://dataspace.copernicus.eu/
   - Create an account
   - Generate OAuth credentials
   - Add credentials to .env file

4. **Files Created/Modified:**
   - ✅ `src/services/SentinelHubService.js` - NEW
   - ✅ `src/controllers/SentinelHubController.js` - NEW
   - ✅ `src/routes/stress.js` - MODIFIED (added Sentinel Hub routes)

### Frontend Setup

1. **Models and Services:**
   - ✅ `src/app/models/sentinel-hub.model.ts` - NEW
   - ✅ `src/app/services/sentinel-hub.service.ts` - NEW

2. **Component Files:**
   - ✅ `src/app/components/sentinel-image-viewer/sentinel-image-viewer.component.ts` - NEW
   - ✅ `src/app/components/sentinel-image-viewer/sentinel-image-viewer.component.html` - NEW
   - ✅ `src/app/components/sentinel-image-viewer/sentinel-image-viewer.component.scss` - NEW

3. **Environment Configuration:**
   - ✅ `src/environments/environment.ts` - MODIFIED
   - ✅ `src/environments/environment.prod.ts` - MODIFIED

## Backend API Endpoints

### 1. Get Satellite Image
```
GET /stress/sentinel/image/:fieldId?imageType=NDVI&date=2024-01-15
```

**Parameters:**
- `fieldId` (required) - Field/Parcel ID
- `imageType` (optional) - 'NDVI' (default), 'TrueColor', 'Moisture'
- `date` (optional) - Image date

**Response:**
- Returns PNG image as binary data
- Headers include field metadata

**Example:**
```bash
curl -X GET "http://localhost:3000/api/stress/sentinel/image/123?imageType=NDVI" \
  -H "Authorization: Bearer token"
```

### 2. Get Image Metadata
```
GET /stress/sentinel/image/:fieldId/metadata
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fieldId": 123,
    "fieldName": "North Field",
    "cropType": "Wheat",
    "area": 12.5,
    "polygon": { "type": "Polygon", "coordinates": [...] },
    "availableImageTypes": [
      {
        "type": "NDVI",
        "description": "Normalized Difference Vegetation Index",
        "colorScale": { "min": "Red", "medium": "Yellow", "max": "Green" }
      },
      { "type": "TrueColor", "description": "Natural RGB satellite image" },
      { "type": "Moisture", "description": "Soil moisture visualization" }
    ],
    "metadata": {
      "resolution": "512x512",
      "format": "PNG",
      "source": "Sentinel-2 L2A",
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 3. Get Field Information
```
GET /stress/sentinel/field/:fieldId/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "North Field",
    "cropType": "Wheat",
    "area": 12.5,
    "season": "Winter 2024",
    "polygon": { "type": "Polygon", "coordinates": [...] },
    "coordinates": { "latitude": 35.123, "longitude": -2.456 },
    "farmerId": 5,
    "imageTypes": ["NDVI", "TrueColor", "Moisture"],
    "status": "active"
  }
}
```

### 4. Get NDVI Legend
```
GET /stress/sentinel/legend
```

**Response:**
```json
{
  "imageType": "NDVI",
  "title": "NDVI Color Scale - Vegetation Health",
  "scale": [
    {
      "value": "< 0.2",
      "color": "#FF0000",
      "label": "Unhealthy/Stressed",
      "description": "Very low vegetation health, severe stress"
    },
    { ... },
    {
      "value": "> 0.55",
      "color": "#00FF00",
      "label": "Excellent",
      "description": "Excellent vegetation health, no stress"
    }
  ],
  "notes": "NDVI ranges from -1 to 1. Values < 0.2 indicate vegetation stress.",
  "dataSource": "Sentinel-2 Satellite"
}
```

### 5. Download Satellite Image
```
POST /stress/sentinel/download/:fieldId
```

**Body:**
```json
{
  "imageType": "NDVI"
}
```

**Response:** PNG image file as attachment

## Frontend Integration

### 1. Import Component in Module/Route

```typescript
import { SentinelImageViewerComponent } from './components/sentinel-image-viewer/sentinel-image-viewer.component';

// In your parent component or route:
@Component({
  selector: 'app-field-detail',
  standalone: true,
  imports: [SentinelImageViewerComponent],
  template: `
    <app-sentinel-image-viewer 
      [fieldId]="selectedFieldId">
    </app-sentinel-image-viewer>
  `
})
export class FieldDetailComponent {
  selectedFieldId = 123;
}
```

### 2. Component Inputs/Outputs

**Inputs:**
- `@Input() fieldId: number` - Required field ID to load

**Component Features:**
- Automatic image loading on initialization
- Image type switching (NDVI, TrueColor, Moisture)
- Zoom with mouse wheel
- Pan with drag when zoomed
- Refresh button
- Download button
- NDVI color legend display
- Field information display
- Acquisition date display
- Loading spinner
- Error handling

### 3. Styling Integration

The component uses:
- **Glassmorphism design** - Modern frosted glass effect
- **Responsive layout** - Works on mobile, tablet, desktop
- **Color scheme** - Green accent (#2ecc71) with modern typography
- **Animations** - Smooth fade-in, slide-in effects
- **Dark mode support** - Automatic detection with CSS variables

### 4. Service Usage (Manual)

If you need to use the service directly:

```typescript
import { SentinelHubService } from './services/sentinel-hub.service';

constructor(private sentinelHubService: SentinelHubService) {}

// Get image as blob
this.sentinelHubService.getFieldImage(fieldId, 'NDVI').subscribe(
  (blob: Blob) => {
    const url = this.sentinelHubService.blobToObjectUrl(blob);
    // Use url for image display
  },
  (error) => console.error('Error loading image', error)
);

// Get metadata
this.sentinelHubService.getImageMetadata(fieldId).subscribe(
  (metadata) => console.log(metadata),
  (error) => console.error('Error loading metadata', error)
);

// Download image
this.sentinelHubService.downloadImage(fieldId, 'NDVI').subscribe(
  (blob: Blob) => {
    const url = this.sentinelHubService.blobToObjectUrl(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'satellite-image.png';
    link.click();
  }
);
```

## Color Scale Legend (NDVI)

### NDVI Values & Meanings:

| NDVI Value | Color | Category | Vegetation Health |
|-----------|-------|----------|-------------------|
| < 0.2 | 🔴 Red | Unhealthy/Stressed | Severe stress, possible wilting |
| 0.2 - 0.35 | 🟠 Orange | Poor | Low health, significant stress |
| 0.35 - 0.45 | 🟡 Yellow | Moderate | Moderate health, some stress |
| 0.45 - 0.55 | 🟢 Yellow-Green | Good | Good health, minor stress |
| > 0.55 | 🟢 Green | Excellent | Healthy vegetation |

### NDVI Calculation:
```
NDVI = (NIR - Red) / (NIR + Red)

where:
- NIR = Near Infrared Band (B08)
- Red = Red Band (B04)
```

## Advanced Features

### 1. Image Visualization Types

**NDVI (Normalized Difference Vegetation Index)**
- Shows vegetation health
- Uses color scale (red-yellow-green)
- Best for crop health monitoring

**True Color**
- Natural RGB satellite image
- Shows actual field appearance
- Good for visual inspection

**Moisture (Future)**
- Uses NDMI (Normalized Difference Moisture Index)
- Shows soil moisture levels
- Requires B11 and B8A bands

### 2. Zoom and Pan

- **Zoom:** Use mouse wheel (scroll up to zoom in, down to zoom out)
- **Pan:** Click and drag when zoomed in
- **Reset:** Double-click to return to original view
- **Limits:** Zoom from 1x to 3x magnification

### 3. Error Handling

The component handles:
- Network errors
- Invalid field IDs
- Missing geometry data
- API failures
- Sentinel Hub credential issues

## Database Requirements

The system uses existing field/parcel database with:
- `id` - Field ID
- `name` - Field name
- `crop_type` - Crop type
- `surface` - Area in hectares
- `polygon` - GeoJSON polygon (WKT or JSON)
- `latitude` / `longitude` - Center coordinates

**Example polygon structure:**
```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-2.456, 35.123],
      [-2.450, 35.123],
      [-2.450, 35.128],
      [-2.456, 35.128],
      [-2.456, 35.123]
    ]
  ]
}
```

## Performance Optimization

1. **Image Caching:**
   - Component caches current image URL
   - Automatic cleanup on component destroy

2. **Token Caching:**
   - Backend caches Sentinel Hub tokens
   - Reuses tokens until expiration (60 seconds before expiry)

3. **Image Resolution:**
   - 512x512 pixels (optimized for balance)
   - PNG format (lossless compression)

4. **Request Timeout:**
   - 30 seconds for Sentinel Hub API calls
   - 10 seconds for token generation

## Troubleshooting

### Issue: "Failed to authenticate with Sentinel Hub"
- **Cause:** Invalid or missing credentials
- **Solution:** Verify SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET in .env

### Issue: "No suitable satellite imagery found"
- **Cause:** No recent imagery available for location
- **Solution:** 
  - Verify field geometry is valid
  - Expand date range in search
  - Check Sentinel-2 coverage for region

### Issue: "Field not found"
- **Cause:** Field ID doesn't exist or has no geometry
- **Solution:** 
  - Verify field ID
  - Ensure field has GeoJSON polygon data in database

### Issue: CORS errors
- **Cause:** Frontend URL not allowed
- **Solution:** Configure CORS in API gateway or stress-service

## Security Considerations

1. **Credentials:**
   - Store Sentinel Hub credentials in .env (never commit)
   - Use environment variables
   - Rotate credentials regularly

2. **API Keys:**
   - Frontend never stores API keys
   - All Sentinel Hub API calls go through backend
   - Backend validates requests

3. **Authentication:**
   - Implement field access control in controller
   - Verify user can access requested field
   - Add authorization middleware

## Future Enhancements

1. **Multi-temporal Analysis:**
   - Compare images over time
   - Show vegetation change
   - Historical trend analysis

2. **Advanced Visualizations:**
   - RGB composite images
   - False color composites
   - Vegetation indices combinations

3. **Alerts:**
   - Automatic alerts for vegetation stress
   - Threshold-based notifications
   - Integration with alert system

4. **Data Export:**
   - Export as GeoTIFF
   - Export metadata as CSV
   - API for bulk downloads

5. **Performance Metrics:**
   - Calculate vegetation index statistics
   - Generate field reports
   - Disease risk assessment

## Testing

### Backend Testing

```bash
# Test image retrieval
curl "http://localhost:3000/api/stress/sentinel/image/1?imageType=NDVI"

# Test metadata
curl "http://localhost:3000/api/stress/sentinel/image/1/metadata"

# Test legend
curl "http://localhost:3000/api/stress/sentinel/legend"
```

### Frontend Testing

```typescript
// In component test file
it('should load satellite image', fakeAsync(() => {
  component.fieldId = 123;
  component.ngOnInit();
  tick();
  
  expect(component.imageUrl).toBeTruthy();
  expect(component.isLoading).toBeFalse();
}));

it('should handle image type switch', () => {
  component.switchImageType('TrueColor');
  expect(component.currentImageType).toBe('TrueColor');
});
```

## References

- [Sentinel Hub Process API Documentation](https://docs.sentinel-hub.com/api/latest/overview/authentication/)
- [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
- [Sentinel-2 Bands Documentation](https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi/resolutions/spatial)
- [NDVI Calculation Guide](https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs in stress-service
3. Check browser console for frontend errors
4. Verify .env configuration
5. Test API endpoints directly with curl

## License

Part of the TerraSens Agricultural Monitoring Platform
