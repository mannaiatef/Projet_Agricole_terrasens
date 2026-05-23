# Crop Calendar Service - Parcelle Entity Upgrade

## Overview

This document describes the complete upgrade of the crop-calendar-service to support geospatial data (latitude, longitude, polygon) required for stress-service compatibility and satellite data processing.

---

## Database Schema Updates

### SQL Migration Script

Run this script to upgrade your existing database:

```sql
-- ============================================
-- Parcelles Table Migration
-- ============================================

-- If creating a new database, this will be created automatically
-- If upgrading an existing database, run these ALTER statements:

ALTER TABLE parcelles 
ADD COLUMN IF NOT EXISTS latitude DOUBLE NOT NULL DEFAULT 0;

ALTER TABLE parcelles 
ADD COLUMN IF NOT EXISTS longitude DOUBLE NOT NULL DEFAULT 0;

ALTER TABLE parcelles 
ADD COLUMN IF NOT EXISTS polygon JSON;

ALTER TABLE parcelles 
ADD COLUMN IF NOT EXISTS soil_type VARCHAR(100);

ALTER TABLE parcelles 
ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(100);

-- Drop old location column if it exists (BACKUP FIRST!)
-- ALTER TABLE parcelles DROP COLUMN location;

-- Add indexes for better query performance
ALTER TABLE parcelles ADD INDEX IF NOT EXISTS idx_user_id (user_id);
ALTER TABLE parcelles ADD INDEX IF NOT EXISTS idx_crop_id (crop_id);

-- ============================================
-- Current Complete Schema
-- ============================================

CREATE TABLE IF NOT EXISTS parcelles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  polygon JSON NOT NULL,
  surface DECIMAL(10, 2),
  crop_id INT,
  sowing_date DATE,
  soil_type VARCHAR(100),
  irrigation_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_crop_id (crop_id)
);
```

### Field Definitions

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | INT | NO | Primary key, auto-increment |
| user_id | INT | NO | Foreign key to user (required for ownership) |
| name | VARCHAR(255) | NO | Parcel name |
| latitude | DOUBLE | NO | Center latitude (-90 to 90) |
| longitude | DOUBLE | NO | Center longitude (-180 to 180) |
| polygon | JSON | NO | GeoJSON Polygon object defining parcel boundaries |
| surface | DECIMAL(10,2) | YES | Parcel area in hectares (optional) |
| crop_id | INT | YES | Foreign key to crops table |
| sowing_date | DATE | YES | Crop sowing date |
| soil_type | VARCHAR(100) | YES | Soil type classification |
| irrigation_type | VARCHAR(100) | YES | Irrigation method (drip, sprinkler, etc.) |
| created_at | TIMESTAMP | NO | Record creation timestamp |
| updated_at | TIMESTAMP | NO | Last update timestamp |

---

## Backend Implementation

### File Structure

```
crop-calendar-service/src/
├── entities/
│   └── parcelle.entity.js              # Parcelle entity with geo-data
├── repositories/
│   └── parcelle.repository.js          # Enhanced with geo-field support
├── controllers/
│   └── parcelle.controller.js          # Validation & error handling
├── dtos/
│   └── parcelle.dto.js                 # Data Transfer Objects
├── utils/
│   ├── geojson-validator.js            # GeoJSON validation
│   └── logger.js                       # Logging utility
├── routes/
│   └── parcelle.routes.js              # API endpoints
├── config/
│   └── db.js                           # Database initialization
└── app.js                              # Express app setup
```

### Key Classes

#### 1. Parcelle Entity
```javascript
new Parcelle(
  id,
  user_id,
  name,
  latitude,
  longitude,
  polygon,
  surface,
  crop_id,
  sowing_date,
  soil_type,
  irrigation_type,
  created_at,
  updated_at
)
```

#### 2. GeoJSON Validator
```javascript
// Validate full polygon
GeoJSONValidator.validatePolygon(polygon);
// Returns: { valid: boolean, errors: string[] }

// Validate latitude/longitude
GeoJSONValidator.validateLatitude(latitude);
GeoJSONValidator.validateLongitude(longitude);

// Validate complete parcel
GeoJSONValidator.validateParcelleGeoData(data);
```

#### 3. DTOs
- **ParcelleDTO**: Full parcel information
- **ParcelleGeoDTO**: Minimal format for stress-service (id, name, latitude, longitude, polygon)
- **CreateParcelleDTO**: Validation for POST requests
- **UpdateParcelleDTO**: Partial updates for PUT requests

---

## API Endpoints

### 1. Create Parcelle (POST)

```http
POST /parcelles HTTP/1.1
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Field Alpha",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "polygon": {
    "type": "Polygon",
    "coordinates": [
      [
        [-7.5898, 33.5731],
        [-7.5895, 33.5731],
        [-7.5895, 33.5728],
        [-7.5898, 33.5728],
        [-7.5898, 33.5731]
      ]
    ]
  },
  "surface": 5.5,
  "soil_type": "clay",
  "irrigation_type": "drip"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Parcelle created successfully",
  "data": {
    "id": 1,
    "user_id": 42,
    "name": "Field Alpha",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "polygon": {
      "type": "Polygon",
      "coordinates": [
        [
          [-7.5898, 33.5731],
          [-7.5895, 33.5731],
          [-7.5895, 33.5728],
          [-7.5898, 33.5728],
          [-7.5898, 33.5731]
        ]
      ]
    },
    "surface": 5.5,
    "crop_id": null,
    "sowing_date": null,
    "soil_type": "clay",
    "irrigation_type": "drip",
    "created_at": "2026-04-08T10:30:00Z",
    "updated_at": "2026-04-08T10:30:00Z"
  }
}
```

### 2. Get Parcelle by ID (GET)

```http
GET /parcelles/{id} HTTP/1.1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parcelle retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 42,
    "name": "Field Alpha",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "polygon": { ... },
    "surface": 5.5,
    "crop_id": null,
    "sowing_date": null,
    "soil_type": "clay",
    "irrigation_type": "drip",
    "created_at": "2026-04-08T10:30:00Z",
    "updated_at": "2026-04-08T10:30:00Z"
  }
}
```

### 3. Get All Parcelles (GET)

```http
GET /parcelles HTTP/1.1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parcelles retrieved successfully",
  "data": [
    { ... },
    { ... }
  ],
  "count": 2
}
```

### 4. Update Parcelle (PUT)

```http
PUT /parcelles/{id} HTTP/1.1
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Field Alpha Updated",
  "surface": 6.0,
  "soil_type": "loamy"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parcelle updated successfully",
  "data": { ... }
}
```

### 5. Delete Parcelle (DELETE)

```http
DELETE /parcelles/{id} HTTP/1.1
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parcelle deleted successfully"
}
```

### 6. Assign Crop (POST)

```http
POST /parcelles/{id}/assign-crop HTTP/1.1
Content-Type: application/json
Authorization: Bearer {token}

{
  "crop_id": 1,
  "sowing_date": "2026-04-15"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Crop assigned successfully",
  "data": {
    "id": 1,
    "user_id": 42,
    "name": "Field Alpha",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "polygon": { ... },
    "surface": 5.5,
    "crop_id": 1,
    "sowing_date": "2026-04-15",
    "soil_type": "clay",
    "irrigation_type": "drip",
    "crop_name": "Wheat",
    "calendar_generated": true,
    "calendar_generation_error": null,
    "created_at": "2026-04-08T10:30:00Z",
    "updated_at": "2026-04-08T11:00:00Z"
  }
}
```

### 7. Generate Calendar (POST)

```http
POST /parcelles/{id}/calendar/generate HTTP/1.1
Content-Type: application/json
Authorization: Bearer {token}

{
  "crop_id": 1,
  "sowing_date": "2026-04-15"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Calendar generated successfully",
  "data": {
    "id": 10,
    "parcelle_id": 1,
    "crop_id": 1,
    "sowing_date": "2026-04-15",
    "created_at": "2026-04-08T11:00:00Z",
    "updated_at": "2026-04-08T11:00:00Z"
  }
}
```

### 8. Internal API - Get Parcelle (No Auth)

Used by stress-service for service-to-service communication:

```http
GET /parcelles/internal/{id} HTTP/1.1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parcelle retrieved successfully",
  "data": {
    "id": 1,
    "name": "Field Alpha",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "polygon": { ... }
  }
}
```

### 9. Internal API - Get All Parcelles (No Auth)

```http
GET /parcelles/internal HTTP/1.1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Parcelles retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Field Alpha",
      "latitude": 33.5731,
      "longitude": -7.5898,
      "polygon": { ... }
    },
    {
      "id": 2,
      "name": "Field Beta",
      "latitude": 35.0895,
      "longitude": -8.1234,
      "polygon": { ... }
    }
  ],
  "count": 2
}
```

---

## Error Handling

### Validation Errors (400 Bad Request)

```json
{
  "success": false,
  "message": "Invalid polygon GeoJSON",
  "details": [
    "Polygon must have at least one ring",
    "Ring 0 must have at least 4 coordinates"
  ]
}
```

### Not Found (404)

```json
{
  "success": false,
  "message": "Parcelle not found"
}
```

### Access Denied (403)

```json
{
  "success": false,
  "message": "Access denied"
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Error creating parcelle",
  "error": "Database connection failed"
}
```

---

## Angular Frontend Integration

### Model Usage

```typescript
import { Parcel, CreateParcelRequest } from './models/stress.model';

// Type-safe parcel creation
const newParcel: CreateParcelRequest = {
  name: "Field Alpha",
  latitude: 33.5731,
  longitude: -7.5898,
  polygon: {
    type: 'Polygon',
    coordinates: [[[-7.5898, 33.5731], ...]]
  },
  surface: 5.5,
  soil_type: 'clay'
};
```

### Service Usage

```typescript
import { ParcelService } from './services/parcel.service';

export class ParcelComponent {
  constructor(private parcelService: ParcelService) {}

  createParcel(data: CreateParcelRequest) {
    this.parcelService.createParcel(data).subscribe({
      next: (parcel) => console.log('Created:', parcel),
      error: (err) => console.error('Error:', err)
    });
  }

  loadParcels() {
    this.parcelService.loadAndCacheParcels().subscribe({
      next: (parcels) => this.parcels = parcels,
      error: (err) => this.error = err.message
    });
  }

  generateMap() {
    this.parcelService.getAllParcelsAsGeoJSON().subscribe({
      next: (features) => {
        // Use features for Leaflet/Mapbox map display
        features.forEach(feature => {
          L.geoJSON(feature).addTo(map);
        });
      }
    });
  }
}
```

---

## GeoJSON Polygon Examples

### Simple Rectangle

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-7.5898, 33.5731],
      [-7.5895, 33.5731],
      [-7.5895, 33.5728],
      [-7.5898, 33.5728],
      [-7.5898, 33.5731]
    ]
  ]
}
```

### Complex Field with Hole

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-7.59, 33.57],
      [-7.58, 33.57],
      [-7.58, 33.56],
      [-7.59, 33.56],
      [-7.59, 33.57]
    ],
    [
      [-7.585, 33.565],
      [-7.583, 33.565],
      [-7.583, 33.563],
      [-7.585, 33.563],
      [-7.585, 33.565]
    ]
  ]
}
```

---

## Validation Rules

### Required Fields
- **name**: non-empty string
- **latitude**: number, -90 to 90
- **longitude**: number, -180 to 180
- **polygon**: valid GeoJSON Polygon

### Optional Fields
- **surface**: decimal number (hectares)
- **soil_type**: string
- **irrigation_type**: string
- **crop_id**: integer (valid crop)
- **sowing_date**: date string (YYYY-MM-DD)

### GeoJSON Polygon Rules
- Must have `type: "Polygon"`
- Must have at least one ring (exterior boundary)
- Each ring must have at least 4 coordinates
- Rings must be closed (first and last coordinate identical)
- Coordinates are [longitude, latitude] (NOT [latitude, longitude])
- Longitude: -180 to 180
- Latitude: -90 to 90

---

## Testing

### Create Test Parcel

```bash
curl -X POST http://localhost:3003/parcelles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Field",
    "latitude": 33.5731,
    "longitude": -7.5898,
    "polygon": {
      "type": "Polygon",
      "coordinates": [[
        [-7.5898, 33.5731],
        [-7.5895, 33.5731],
        [-7.5895, 33.5728],
        [-7.5898, 33.5728],
        [-7.5898, 33.5731]
      ]]
    },
    "surface": 5.5
  }'
```

### Stress Service Integration Test

```bash
# Get parcel in stress-service format (no auth required)
curl http://localhost:3003/parcelles/internal/1
```

---

## Compatibility Notes

### Stress-Service Requirements
✅ **SATISFIED**
- Requires: `id`, `name`, `latitude`, `longitude`, `polygon`
- Response: `ParcelleGeoDTO` includes all required fields

### Frontend Map Display
✅ **SATISFIED**
- Uses Parcel model with full geospatial data
- GeoJSON Polygon for Leaflet/Mapbox integration
- Latitude/longitude for centering

### Database
✅ **SATISFIED**
- Uses JSON type for efficient GeoJSON storage
- Indexes on user_id for user-specific queries
- Proper nullable handling for optional fields

---

## Performance Considerations

1. **Database Indexes**: Added on `user_id` and `crop_id` for faster queries
2. **DTO Layer**: Reduces data transfer for stress-service (no user_id, surface, etc.)
3. **JSON Storage**: MySQL JSON type efficiently stores polygon data
4. **Connection Pooling**: Managed by mysql2/promise

---

## Production Deployment Checklist

- [ ] Run database migration scripts
- [ ] Update environment variables (.env)
- [ ] Restart crop-calendar-service
- [ ] Verify API endpoints work
- [ ] Test stress-service integration
- [ ] Verify Angular frontend loads
- [ ] Run integration tests
- [ ] Monitor logs for errors

---

## Backward Compatibility

If you have existing parcelles without geo-data:

```sql
-- Generate default polygon from lat/lon (requires both to exist)
UPDATE parcelles 
SET polygon = JSON_OBJECT(
  'type', 'Polygon',
  'coordinates', JSON_ARRAY(
    JSON_ARRAY(
      JSON_ARRAY(longitude - 0.001, latitude - 0.001),
      JSON_ARRAY(longitude + 0.001, latitude - 0.001),
      JSON_ARRAY(longitude + 0.001, latitude + 0.001),
      JSON_ARRAY(longitude - 0.001, latitude + 0.001),
      JSON_ARRAY(longitude - 0.001, latitude - 0.001)
    )
  )
)
WHERE polygon IS NULL;
```

---

## Support

For issues or questions:
1. Check error message and validation rules
2. Review GeoJSON format examples
3. Verify database migration was completed
4. Check service logs for detailed errors
