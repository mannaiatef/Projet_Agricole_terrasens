# 🌱 Disease Detection Service

Production-ready microservice for crop disease detection using AI (Hugging Face) integrated into the Terrasens SaaS platform.

## 📋 Features

- ✅ Image upload with validation (jpg, png, max 5MB)
- ✅ AI-powered disease detection via Hugging Face API
- ✅ Rule-based recommendation engine
- ✅ Database persistence of analysis history
- ✅ RESTful API with proper error handling
- ✅ Clean architecture (Controller/Service/Repository pattern)
- ✅ Production-ready with async/await
- ✅ Modular and scalable structure

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Hugging Face API Key

### Installation

1. **Clone and Install Dependencies**
```bash
cd disease-detection-service
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup Database**
```bash
npm run migrate
```

4. **Start Service**
```bash
npm start       # Production
npm run dev     # Development (with nodemon)
```

## 🏗️ Architecture

```
src/
├── controllers/       # Request handlers
├── services/         # Business logic
├── repositories/     # Database access
├── middleware/       # Express middleware
├── config/          # Configuration files
├── utils/           # Helper functions
└── server.js        # Application entry point
```

## 📡 API Endpoints

### Upload & Analyze Image
```http
POST /api/v1/disease/analyze
Content-Type: multipart/form-data

Parameters:
- image (file, required): Image file (jpg/png, max 5MB)
- parcelleId (number, optional): Associated parcel ID
- cropType (string, optional): Type of crop
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analysisId": "550e8400-e29b-41d4-a716-446655440000",
    "disease": "Tomato Early Blight",
    "confidence": 92,
    "recommendation": "Use fungicide (e.g., chlorothalonil) and reduce irrigation frequency. Remove infected leaves.",
    "treatment": {
      "fungicide": "chlorothalonil",
      "action": "reduce watering",
      "urgency": "high"
    },
    "analyzedAt": "2026-04-17T10:30:00Z"
  }
}
```

### Get Analysis History
```http
GET /api/v1/disease/history?limit=10&offset=0
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "analysisId": "550e8400-e29b-41d4-a716-446655440000",
      "disease": "Tomato Early Blight",
      "confidence": 92,
      "recommendation": "...",
      "parcelleId": 5,
      "imageUrl": "uploads/diseases/image_uuid.jpg",
      "createdAt": "2026-04-17T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

### Get Single Analysis
```http
GET /api/v1/disease/analysis/:analysisId
Authorization: Bearer {token}
```

## 🔌 Integration with API Gateway

Add this proxy configuration to API Gateway's `src/config/proxy-config.js`:

```javascript
{
  context: '/api/v1/disease',
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/disease': '/api/v1/disease'
  }
}
```

## 💾 Database Schema

```sql
CREATE TABLE disease_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  analysis_id VARCHAR(36) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  parcel_id INT,
  image_url VARCHAR(255) NOT NULL,
  disease_name VARCHAR(255) NOT NULL,
  confidence INT NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  recommendation TEXT NOT NULL,
  treatment_type VARCHAR(50),
  raw_response LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parcel_id) REFERENCES parcelles(id),
  INDEX idx_user_id (user_id),
  INDEX idx_parcel_id (parcel_id),
  INDEX idx_created_at (created_at)
);
```

## 🤖 AI Integration

### Hugging Face Model
- **Model**: `neilyo/plant-disease-identification`
- **Input**: Image (jpg/png)
- **Output**: Predicted disease labels with confidence scores

### Recommendation Engine Rules

| Disease Pattern | Recommendation |
|---|---|
| Blight | Use fungicide (chlorothalonil) + reduce irrigation |
| Mildew | Improve air circulation + lower humidity |
| Rust | Remove infected leaves + use appropriate fungicide |
| Leaf Spot | Surface treatment + proper spacing |
| Wilt | Check soil moisture + improve drainage |
| Default | Consult agricultural expert |

## ⚠️ Error Handling

| Status | Description |
|--------|-------------|
| 400 | Invalid image or missing parameters |
| 401 | Unauthorized (invalid token) |
| 413 | File too large (>5MB) |
| 500 | Server error or AI API failure |
| 503 | AI service unavailable |

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_IMAGE_TYPE",
    "message": "Only JPG and PNG images are allowed",
    "details": "Provided: image/gif"
  }
}
```

## 🔐 Authentication

All endpoints require Bearer token authentication (from Auth Service):

```bash
curl -H "Authorization: Bearer your_jwt_token" \
  http://localhost:3005/api/v1/disease/history
```

## 🧪 Testing

```bash
npm test
```

## 📦 Docker Deployment

```bash
docker build -t disease-detection-service .
docker run -p 3005:3005 --env-file .env disease-detection-service
```

## 🔄 Real-time Features (Bonus)

- WebSocket support for real-time analysis status
- Notification system for disease detection
- Multilingual support (EN, FR, AR)

## 📝 License

Proprietary - Terrasens Platform

## 👥 Support

For issues or questions, contact the development team.
