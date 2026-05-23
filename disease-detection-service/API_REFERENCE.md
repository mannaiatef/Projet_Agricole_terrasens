# 📡 API Endpoints & Testing Guide

## Base URL

```
Development:   http://localhost:3005/api/v1/disease
Production:    https://api.terrasens.com/api/v1/disease
Via Gateway:   http://localhost:3000/api/v1/disease
```

## Authentication

All endpoints (except health check) require Bearer token in Authorization header:

```
Authorization: Bearer {jwt_token}
X-User-ID: {user_id}
```

---

## Endpoints

### 1. **POST /analyze**

Upload image and perform disease analysis.

#### Request
```bash
curl -X POST http://localhost:3005/api/v1/disease/analyze \
  -H "Authorization: Bearer your_token" \
  -H "X-User-ID: 1" \
  -F "image=@crop_image.jpg" \
  -F "parcelId=5" \
  -F "cropType=tomato"
```

#### Form Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | file | ✅ | JPG or PNG image, max 5MB |
| parcelId | number | ❌ | Associated parcel ID |
| cropType | string | ❌ | Type of crop (tomato, pepper, etc) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "disease": "Tomato Early Blight",
    "confidence": 92,
    "topPredictions": [
      {
        "label": "Tomato Early Blight",
        "score": 92
      },
      {
        "label": "Tomato Late Blight",
        "score": 5
      },
      {
        "label": "Healthy",
        "score": 3
      }
    ],
    "recommendation": "Use fungicide (chlorothalonil) and reduce irrigation frequency. Remove infected leaves.",
    "treatment": {
      "type": "fungicide",
      "actions": [
        "Use fungicide (chlorothalonil or mancozeb)",
        "Remove infected leaves",
        "Increase air circulation",
        "Avoid overhead watering"
      ]
    },
    "urgency": "high",
    "isUncertain": false,
    "imageUrl": "uploads/diseases/disease-1660817400000-a1b2c3d4.jpg",
    "analyzedAt": "2026-04-17T10:30:00Z"
  }
}
```

#### Error Responses

**400 - Invalid Image**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_TYPE",
    "message": "Only JPG and PNG images are allowed"
  }
}
```

**413 - File Too Large**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds 5MB limit"
  }
}
```

**503 - AI Service Unavailable**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Hugging Face API service unavailable. Please try again later."
  }
}
```

---

### 2. **GET /history**

Get analysis history for authenticated user.

#### Request
```bash
curl -X GET "http://localhost:3005/api/v1/disease/history?limit=10&offset=0" \
  -H "Authorization: Bearer your_token" \
  -H "X-User-ID: 1"
```

#### Query Parameters
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| limit | number | 10 | 100 | Results per page |
| offset | number | 0 | - | Pagination offset |

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "analysisId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": 1,
      "parcelId": 5,
      "imageUrl": "uploads/diseases/disease-1660817400000-a1b2c3d4.jpg",
      "diseaseName": "Tomato Early Blight",
      "confidence": 92,
      "recommendation": "Use fungicide (chlorothalonil) and reduce irrigation frequency...",
      "treatmentType": "fungicide",
      "createdAt": "2026-04-17T10:30:00Z",
      "updatedAt": "2026-04-17T10:30:00Z"
    },
    {
      "analysisId": "661f9511-f40c-52e5-b827-557766555111",
      "userId": 1,
      "parcelId": 3,
      "imageUrl": "uploads/diseases/disease-1660817200000-x9y8z7w6.jpg",
      "diseaseName": "Powdery Mildew",
      "confidence": 78,
      "recommendation": "Fungicide (sulfur-based) and reduce humidity...",
      "treatmentType": "fungicide",
      "createdAt": "2026-04-16T15:20:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "pages": 3
  }
}
```

---

### 3. **GET /analysis/:analysisId**

Get details of a specific analysis.

#### Request
```bash
curl -X GET "http://localhost:3005/api/v1/disease/analysis/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer your_token"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": 1,
    "parcelId": 5,
    "imageUrl": "uploads/diseases/disease-1660817400000-a1b2c3d4.jpg",
    "diseaseName": "Tomato Early Blight",
    "confidence": 92,
    "recommendation": "...",
    "treatmentType": "fungicide",
    "createdAt": "2026-04-17T10:30:00Z",
    "imageMetadata": {
      "analysisId": "550e8400-e29b-41d4-a716-446655440000",
      "originalFilename": "tomato_leaf.jpg",
      "fileSize": 245680,
      "mimeType": "image/jpeg",
      "storagePath": "uploads/diseases/disease-1660817400000-a1b2c3d4.jpg"
    }
  }
}
```

---

### 4. **GET /parcel/:parcelId**

Get all analyses for a specific parcel.

#### Request
```bash
curl -X GET "http://localhost:3005/api/v1/disease/parcel/5?limit=5" \
  -H "Authorization: Bearer your_token"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "analysisId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": 1,
      "parcelId": 5,
      "diseaseName": "Tomato Early Blight",
      "confidence": 92,
      "createdAt": "2026-04-17T10:30:00Z"
    }
  ],
  "pagination": {
    "limit": 5,
    "offset": 0
  }
}
```

---

### 5. **GET /statistics**

Get disease statistics for authenticated user.

#### Request
```bash
curl -X GET "http://localhost:3005/api/v1/disease/statistics" \
  -H "Authorization: Bearer your_token" \
  -H "X-User-ID: 1"
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "diseaseName": "Tomato Early Blight",
      "count": 8,
      "percentage": "42.1",
      "avgConfidence": 87.5,
      "avgConfidencePercent": 88
    },
    {
      "diseaseName": "Powdery Mildew",
      "count": 6,
      "percentage": "31.6",
      "avgConfidence": 82.3,
      "avgConfidencePercent": 82
    },
    {
      "diseaseName": "Leaf Rust",
      "count": 5,
      "percentage": "26.3",
      "avgConfidence": 79.8,
      "avgConfidencePercent": 80
    }
  ],
  "summary": {
    "totalAnalyses": 19,
    "uniqueDiseases": 3
  }
}
```

---

### 6. **GET /high-risk**

Get high-confidence disease detections (potential issues).

#### Request
```bash
curl -X GET "http://localhost:3005/api/v1/disease/high-risk?confidence=80" \
  -H "Authorization: Bearer your_token" \
  -H "X-User-ID: 1"
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| confidence | number | 80 | Minimum confidence threshold |

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "analysisId": "550e8400-e29b-41d4-a716-446655440000",
      "diseaseName": "Tomato Early Blight",
      "confidence": 92,
      "createdAt": "2026-04-17T10:30:00Z",
      "parcelId": 5
    },
    {
      "analysisId": "661f9511-f40c-52e5-b827-557766555111",
      "diseaseName": "Powdery Mildew",
      "confidence": 87,
      "createdAt": "2026-04-16T15:20:00Z",
      "parcelId": 3
    }
  ],
  "threshold": 80
}
```

---

### 7. **DELETE /analysis/:analysisId**

Delete an analysis and associated image.

#### Request
```bash
curl -X DELETE "http://localhost:3005/api/v1/disease/analysis/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer your_token" \
  -H "X-User-ID: 1"
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Analysis deleted successfully"
}
```

#### Error Response (403 - Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Cannot delete other user's analysis"
  }
}
```

---

### 8. **GET /health**

Health check endpoint (no authentication required).

#### Request
```bash
curl http://localhost:3005/api/v1/disease/health
```

#### Response (200 OK)
```json
{
  "status": "ok",
  "service": "disease-detection-service",
  "timestamp": "2026-04-17T10:30:00Z"
}
```

---

## Testing with cURL

### Test Image Upload
```bash
# Create test image (1x1 pixel PNG)
python3 << 'EOF'
from PIL import Image
img = Image.new('RGB', (100, 100), color='red')
img.save('/tmp/test.png')
EOF

# Upload for analysis
curl -X POST http://localhost:3005/api/v1/disease/analyze \
  -H "Authorization: Bearer test_token" \
  -H "X-User-ID: 1" \
  -F "image=@/tmp/test.png" \
  -F "parcelId=5"
```

### Test History Pagination
```bash
# Page 1
curl "http://localhost:3005/api/v1/disease/history?limit=5&offset=0" \
  -H "Authorization: Bearer test_token" \
  -H "X-User-ID: 1"

# Page 2
curl "http://localhost:3005/api/v1/disease/history?limit=5&offset=5" \
  -H "Authorization: Bearer test_token" \
  -H "X-User-ID: 1"
```

### Test Error Handling
```bash
# Missing image
curl -X POST http://localhost:3005/api/v1/disease/analyze \
  -H "Authorization: Bearer test_token" \
  -H "X-User-ID: 1"

# Invalid file type
echo "This is not an image" > /tmp/test.txt
curl -X POST http://localhost:3005/api/v1/disease/analyze \
  -H "Authorization: Bearer test_token" \
  -H "X-User-ID: 1" \
  -F "image=@/tmp/test.txt"

# Missing authentication
curl -X POST http://localhost:3005/api/v1/disease/analyze \
  -F "image=@test.jpg"
```

---

## Testing with Postman

### 1. Create Environment
Variables:
```json
{
  "base_url": "http://localhost:3005/api/v1/disease",
  "token": "your_jwt_token",
  "user_id": "1",
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Create Collection

**Analyze Disease**
- Method: `POST`
- URL: `{{base_url}}/analyze`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `X-User-ID: {{user_id}}`
- Body: form-data
  - `image`: file (select test image)
  - `parcelId`: 5

**Get History**
- Method: `GET`
- URL: `{{base_url}}/history?limit=10&offset=0`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `X-User-ID: {{user_id}}`

**Get Statistics**
- Method: `GET`
- URL: `{{base_url}}/statistics`
- Headers:
  - `Authorization: Bearer {{token}}`
  - `X-User-ID: {{user_id}}`

---

## Rate Limiting

Recommended limits:
- Image uploads: 10 per minute per user
- History queries: 30 per minute per user
- Hugging Face API: 5 per minute (free tier)

## Error Codes Summary

| Code | Status | Description |
|------|--------|-------------|
| MISSING_IMAGE | 400 | Image file not provided |
| INVALID_IMAGE_TYPE | 400 | File type not JPG/PNG |
| FILE_TOO_LARGE | 413 | File exceeds 5MB |
| MISSING_TOKEN | 401 | Authorization header missing |
| INVALID_TOKEN | 401 | Token invalid or expired |
| NOT_FOUND | 404 | Analysis not found |
| UNAUTHORIZED | 403 | Cannot access resource |
| SERVICE_UNAVAILABLE | 503 | AI service down |
| INTERNAL_ERROR | 500 | Server error |
