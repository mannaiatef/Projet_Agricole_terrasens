# TerraSens Chatbot Service - API Documentation

## Overview

The TerraSens Chatbot Service is a sophisticated AI-powered microservice that acts as an intelligent agent for the TerraSens smart agriculture platform. It integrates with Google's Generative AI (Gemini) to understand user intent and intelligently route requests to appropriate backend microservices.

**Base URL**: `http://api-gateway:3000/api/chat` or `http://localhost:3000/api/chat`

**Authentication**: All endpoints require JWT Bearer token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Message Endpoints](#message-endpoints)
3. [Image Upload](#image-upload)
4. [History Endpoints](#history-endpoints)
5. [Error Handling](#error-handling)
6. [Examples](#examples)
7. [Tool Descriptions](#tool-descriptions)

---

## Authentication

### JWT Token

All protected endpoints require an `Authorization` header with a valid JWT token from the auth-service.

```bash
Authorization: Bearer <jwt_token>
```

**Token Structure:**
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "role": "farmer",
  "iat": 1704067200,
  "exp": 1704153600
}
```

**Get Token:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

---

## Message Endpoints

### 1. Send Message

Send a text message to the chatbot. The service will process the message with AI and call appropriate microservices.

**Endpoint:**
```
POST /chat
```

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "message": "What's the stress level in parcel 123?",
  "parcelleId": "123"  // Optional
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| message | string | Yes | User message (max 5000 characters) |
| parcelleId | string | No | Parcel/field ID for context |

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "response": "The stress level in parcel 123 is currently high. Here's what we found...\n\n📊 Data Summary:\n\nPlant Stress Analysis:\n- Stress Level: High\n- NDVI Score: 0.45\n- Recommendation: Increase irrigation\n- Last Updated: 2024-04-24T10:30:00Z",
    "toolsUsed": ["getStress"],
    "timestamp": "2024-04-24T10:30:00Z"
  }
}
```

**Response (Error - 4xx/5xx):**
```json
{
  "success": false,
  "message": "Failed to process message",
  "error": "Detailed error message"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the irrigation status for parcel 456?",
    "parcelleId": "456"
  }'
```

**JavaScript/TypeScript Example:**
```typescript
// Using Angular HttpClient
import { HttpClient, HttpHeaders } from '@angular/common/http';

const headers = new HttpHeaders({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

this.http.post('/api/chat', {
  message: 'How is my crop calendar progressing?',
  parcelleId: '789'
}, { headers }).subscribe(response => {
  console.log(response.data.response);
});
```

**Python Example:**
```python
import requests

url = "http://localhost:3000/api/chat"
headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}
payload = {
    "message": "Upload an image for disease detection",
    "parcelleId": "123"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## Image Upload

### Upload Crop Image

Upload a crop image for disease detection and analysis.

**Endpoint:**
```
POST /chat/image
```

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| image | File | Yes | Image file (JPEG/PNG, max 25MB) |
| parcelleId | string | No | Parcel ID for context |

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "conversationId": "550e8400-e29b-41d4-a716-446655440000",
    "analysis": "Disease Detection:\n- Detected Disease: Early Blight\n- Confidence: 87.5%\n- Severity: Medium",
    "recommendations": "Based on the disease detected, here are the recommendations:\n\n1. Fungicide Application:\n   - Apply copper-based fungicide\n   - Repeat every 7-10 days\n   - Spray in early morning\n\n2. Crop Management:\n   - Remove infected leaves\n   - Improve air circulation\n   - Reduce leaf wetness\n\n3. Preventive Measures:\n   - Practice crop rotation\n   - Use resistant varieties\n   - Monitor closely for spread",
    "diseaseData": {
      "disease": "Early Blight",
      "confidence": 0.875,
      "severity": "medium",
      "treatment": "Fungicide application with preventive measures"
    },
    "timestamp": "2024-04-24T10:35:00Z"
  }
}
```

**Error Cases:**
| Status | Message | Cause |
|--------|---------|-------|
| 400 | No image file provided | File upload missing |
| 400 | Only JPEG and PNG images are allowed | Invalid file type |
| 400 | Image file is too large (max 25MB) | File size exceeds limit |
| 500 | Failed to process image | Service error |

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/chat/image \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "image=@/path/to/crop_image.jpg" \
  -F "parcelleId=123"
```

**JavaScript/TypeScript Example:**
```typescript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('parcelleId', parcelleId);

this.http.post('/api/chat/image', formData, { headers }).subscribe(response => {
  console.log('Disease Analysis:', response.data.analysis);
  console.log('Recommendations:', response.data.recommendations);
});
```

**Python Example:**
```python
import requests

url = "http://localhost:3000/api/chat/image"
headers = {"Authorization": f"Bearer {jwt_token}"}

with open('crop_disease.jpg', 'rb') as img:
    files = {'image': img}
    data = {'parcelleId': '123'}
    response = requests.post(url, files=files, data=data, headers=headers)
    print(response.json())
```

---

## History Endpoints

### Get Conversation History

Retrieve conversation history for the authenticated user.

**Endpoint:**
```
GET /chat/history
```

**Query Parameters:**
| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| limit | number | 50 | 100 | Number of records to return |
| offset | number | 0 | - | Number of records to skip |

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userMessage": "What's the stress level?",
        "botResponse": "The stress level is high...",
        "toolsUsed": ["getStress"],
        "confidence": 0.92,
        "createdAt": "2024-04-24T10:30:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "userMessage": "Show irrigation recommendations",
        "botResponse": "Here are the irrigation recommendations...",
        "toolsUsed": ["getIrrigationStatus"],
        "confidence": 0.88,
        "createdAt": "2024-04-24T10:25:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "pages": 3
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:3000/api/chat/history?limit=20&offset=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Clear Conversation History

Delete all conversation history for the authenticated user.

**Endpoint:**
```
DELETE /chat/history
```

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "message": "Conversation history cleared"
  }
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/chat/history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid message, missing parameters |
| 401 | Unauthorized | Missing or invalid token |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Internal Server Error | Service error, database error |
| 503 | Service Unavailable | Backend service down |

### Common Errors

**Authentication Error:**
```json
{
  "success": false,
  "message": "Invalid token",
  "error": "jwt malformed"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Message cannot be empty"
}
```

**Service Unavailable:**
```json
{
  "success": false,
  "message": "Stress service is unavailable",
  "error": "Connection timeout"
}
```

---

## Examples

### Example 1: Stress Analysis Query

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer token123" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "كم مستوى الإجهاد في قطعة أرضي رقم 101؟",
    "parcelleId": "101"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "abc-123",
    "response": "مستوى الإجهاد في قطعتك عالي جداً...\n\n📊 ملخص البيانات:\n\nتحليل إجهاد النبات:\n- مستوى الإجهاد: عالي\n- درجة NDVI: 0.45",
    "toolsUsed": ["getStress"],
    "timestamp": "2024-04-24T10:30:00Z"
  }
}
```

### Example 2: Irrigation Recommendation

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer token123" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "When should I water my crops next?",
    "parcelleId": "202"
  }'
```

### Example 3: Crop Calendar Query

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer token123" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What stage is my crop currently in?",
    "parcelleId": "303"
  }'
```

### Example 4: Disease Detection

```bash
curl -X POST http://localhost:3000/api/chat/image \
  -H "Authorization: Bearer token123" \
  -F "image=@diseased_leaf.png" \
  -F "parcelleId=404"
```

---

## Tool Descriptions

### 1. getStress

Analyzes plant stress levels using vegetation indices and satellite data.

**Purpose:** Get stress analysis for crops
**Returns:** Stress level, NDVI score, recommendations
**Input:** `parcelleId` (string)

**Example Response:**
```json
{
  "stressLevel": "High",
  "ndviScore": 0.45,
  "recommendation": "Increase irrigation immediately",
  "timestamp": "2024-04-24T10:30:00Z"
}
```

### 2. getIrrigationStatus

Provides current irrigation status and watering recommendations.

**Purpose:** Get irrigation schedule and water requirements
**Returns:** Moisture level, watering schedule, water needed
**Input:** `parcelleId` (string)

**Example Response:**
```json
{
  "moistureLevel": 35,
  "irrigationRecommendation": "Water now",
  "nextWateringTime": "2024-04-25T06:00:00Z",
  "waterRequired": "25mm"
}
```

### 3. getCropCalendar

Retrieves crop calendar and growth stage information.

**Purpose:** Get crop stages and timeline
**Returns:** Current stage, all stages, timeline
**Input:** `parcelleId` (string)

**Example Response:**
```json
{
  "cropName": "Wheat",
  "currentStage": "Grain Filling",
  "stages": [
    {
      "name": "Germination",
      "startDate": "2024-03-01",
      "endDate": "2024-03-15"
    },
    {
      "name": "Vegetative Growth",
      "startDate": "2024-03-15",
      "endDate": "2024-04-15"
    },
    {
      "name": "Grain Filling",
      "startDate": "2024-04-15",
      "endDate": "2024-05-15"
    }
  ]
}
```

### 4. detectDisease

Analyzes crop images for disease detection.

**Purpose:** Identify plant diseases from images
**Returns:** Disease type, confidence, treatment
**Input:** `imagePath` (string)

**Example Response:**
```json
{
  "disease": "Early Blight",
  "confidence": 0.87,
  "severity": "medium",
  "treatment": "Apply copper-based fungicide every 7-10 days"
}
```

---

## Integration Guide

### Frontend Integration (Angular)

See the ChatService in `frontend/src/app/features/chatbot/services/chat.service.ts`

### Backend Integration

All microservices are called through the API Gateway and the chatbot service's tool executor.

---

## Rate Limiting

Currently, no rate limiting is implemented. Production deployments should consider:
- 100 requests/minute per user
- 10 image uploads/hour per user
- 5000 character message limit

---

## Webhooks (Future)

Planned webhook support for:
- Real-time notifications
- Scheduled alerts
- Integration with external systems

---

## Support

For issues or questions, refer to:
- Backend Documentation: `chatbot-service/README.md`
- Service Documentation: Each service's README.md
- Main Repository: `DELIVERY_SUMMARY.md`

---

**API Version:** 1.0.0  
**Last Updated:** April 24, 2024  
**Status:** Production Ready
