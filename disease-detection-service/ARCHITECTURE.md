# 🏗️ Architecture & Design Documentation

## System Overview

The Crop Disease Detection Module is a microservice component of the Terrasens SaaS platform that provides AI-powered disease identification and treatment recommendations.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Angular Frontend (4200)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Disease Upload Component  │  Disease History Component   │   │
│  │  ├─ Image Preview           │  ├─ Analysis History        │   │
│  │  ├─ Disease Results         │  ├─ Statistics              │   │
│  │  └─ Recommendations         │  └─ Pagination              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │    API Gateway   │
        │    (Port 3000)   │
        │  /api/v1/disease │
        └────────┬─────────┘
                 │
    ┌────────────▼─────────────────┐
    │ Disease Detection Service    │
    │ (Port 3005)                  │
    │                              │
    │ ┌────────────────────────┐   │
    │ │   Controllers          │   │
    │ │ ├─ analyzeImage        │   │
    │ │ ├─ getHistory          │   │
    │ │ ├─ getStatistics       │   │
    │ │ └─ deleteAnalysis      │   │
    │ └────────────────────────┘   │
    │            ▼                  │
    │ ┌────────────────────────┐   │
    │ │   Services             │   │
    │ │ ├─ DiseaseAnalysis     │   │
    │ │ ├─ HuggingFace API     │   │
    │ │ └─ Recommendations     │   │
    │ └────────────────────────┘   │
    │            ▼                  │
    │ ┌────────────────────────┐   │
    │ │   Repositories         │   │
    │ │ ├─ Disease Analysis    │   │
    │ │ └─ Analysis Images     │   │
    │ └────────────────────────┘   │
    └────────────┬─────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │  MySQL Database               │
    │  ├─ disease_analysis          │
    │  ├─ analysis_images           │
    │  └─ disease_notifications     │
    └───────────────────────────────┘

    ┌─────────────────────────────────────┐
    │ Hugging Face API (Inference)        │
    │ Model: neilyo/plant-disease-id      │
    └─────────────────────────────────────┘
```

## Clean Architecture Pattern

### 1. **Controllers Layer** (`src/controllers/`)
- **Responsibility**: Handle HTTP requests and responses
- **Key Component**: `DiseaseAnalysisController`
  - Validates request parameters
  - Calls services with sanitized data
  - Formats HTTP responses
  - Implements error handling

```javascript
// Example: Controller calls service
analyzeImage = async (req, res) => {
  const result = await this.service.analyzeImage(userId, req.file);
  res.json({ success: true, data: result });
}
```

### 2. **Services Layer** (`src/services/`)
- **Responsibility**: Business logic and orchestration
- **Key Component**: `DiseaseAnalysisService`
  - Coordinates workflow (upload → AI analysis → save)
  - Calls multiple repositories
  - Integrates external services (Hugging Face)
  - Implements recommendation engine

```javascript
// Example: Service orchestrates components
async analyzeImage(userId, file, options) {
  // 1. Validate
  // 2. Send to AI
  // 3. Generate recommendation
  // 4. Save to database
  // 5. Return result
}
```

### 3. **Repository Layer** (`src/repositories/`)
- **Responsibility**: Data access abstraction
- **Key Components**:
  - `DiseaseAnalysisRepository` - CRUD for analyses
  - `AnalysisImageRepository` - Image metadata

```javascript
// Example: Repository handles all database operations
static async create(userId, analysisData) {
  const sql = "INSERT INTO disease_analysis ...";
  return Database.query(sql, params);
}
```

### 4. **Utilities Layer** (`src/utils/`)
- **Responsibility**: Reusable helper classes
- **Key Classes**:
  - `HuggingFaceService` - AI API integration
  - `RecommendationEngine` - Disease→Treatment mapping
  - `ImageUploadHelper` - File validation and storage

```javascript
// Example: Utility provides specialized functionality
class RecommendationEngine {
  static generateRecommendation(disease, confidence) {
    // Rule-based disease → treatment mapping
  }
}
```

### 5. **Middleware Layer** (`src/middleware/`)
- **Responsibility**: Cross-cutting concerns
- **Key Middlewares**:
  - `upload.js` - File upload handling with multer
  - `auth.js` - JWT token validation

```javascript
// Example: Middleware enforces authentication
const verifyAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: '...' });
  next();
}
```

## Data Flow Diagram

### 1. Image Upload & Analysis Flow

```
┌─────────┐
│ User    │
└────┬────┘
     │ POST /api/v1/disease/analyze
     │ + image file + parcelId
     │
┌────▼──────────────────────┐
│ DiseaseUploadComponent     │
│ (Angular Frontend)         │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ API Gateway               │
│ Routes to Port 3005        │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ DiseaseAnalysisController │
│ - Validate file type      │
│ - Check file size         │
│ - Extract userId          │
└────┬──────────────────────┘
     │
┌────▼──────────────────────┐
│ DiseaseAnalysisService    │
│ - Process upload           │
│ - Call Hugging Face API   │
│ - Generate recommendations│
│ - Save to database        │
└────┬──────────────────────┘
     │  (Parallel operations)
     │
  ┌──┴────────────────┬────────────────┐
  │                   │                │
┌─▼──────────────┐ ┌─▼──────────────┐ ┌─▼──────────────┐
│ Save Image     │ │ Hugging Face   │ │ Generate       │
│ to Disk        │ │ API Request    │ │ Recommendation │
│                │ │ (AI Analysis)  │ │                │
└────────────────┘ └────────────────┘ └────────────────┘
  │                   │                │
  └───────┬───────────┴────────────────┘
          │
       ┌──▼──────────────────────┐
       │ DiseaseAnalysisRepo     │
       │ - Create analysis record│
       │ - Link image metadata   │
       │ - Update statistics     │
       └──┬───────────────────────┘
          │
       ┌──▼──────────────────────┐
       │ MySQL Database          │
       │ INSERT disease_analysis │
       │ INSERT analysis_images  │
       └────────────────────────┘
          │
          │ Response
          │
    ┌─────▼──────────────────┐
    │ Return JSON Response   │
    │ - analysisId           │
    │ - disease              │
    │ - confidence           │
    │ - recommendation       │
    │ - imageUrl             │
    └────────────────────────┘
```

### 2. Disease Recommendations Workflow

```
Detected Disease (with confidence score)
    │
    ▼
RecommendationEngine.generateRecommendation()
    │
    ├─► Search predefined mappings
    │   (blight, mildew, rust, etc.)
    │
    ├─► If found:
    │   - Get treatments
    │   - Get actions
    │   - Determine urgency
    │   - Format recommendation
    │
    └─► If not found:
        - Generate default recommendation
        - Suggest expert consultation
        - Mark as "uncertain" (<70% confidence)
        │
        ▼
    Return structured recommendation object
```

## Error Handling Strategy

### 1. **Request Validation Errors** (400)
```javascript
// File type validation
if (!['image/jpeg', 'image/png'].includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### 2. **Authentication Errors** (401)
```javascript
if (!authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### 3. **Resource Errors** (404)
```javascript
const analysis = await repo.findById(id);
if (!analysis) {
  throw { statusCode: 404, message: 'Not found' };
}
```

### 4. **AI Service Errors** (503)
```javascript
try {
  return await this.huggingFaceService.analyzeImage(buffer);
} catch (error) {
  // Return fallback recommendation
  // Mark as uncertain
}
```

### 5. **Database Errors** (500)
```javascript
try {
  await Database.query(sql, params);
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Internal server error');
}
```

## Module Interactions

### Disease Detection Service ↔ Other Services

1. **Auth Service** (Port 3002)
   - Uses JWT tokens for authentication
   - Validates user identity

2. **API Gateway** (Port 3000)
   - Routes `/api/v1/disease/*` to port 3005
   - Applies cross-cutting policies
   - Handles rate limiting

3. **Crop Calendar Service** (Port 3003)
   - References parcelle_id for linking
   - Can query disease history by parcel

## Database Relationships

```sql
-- Users (from Auth Service)
users (id, email, ...)
  ▲
  │ FK: user_id
  │
disease_analysis (id, user_id, parcel_id, ...)
  │
  │ FK: parcel_id
  ▼
parcelles (id, ...)  -- from Crop Calendar Service

-- Image Metadata
disease_analysis (analysis_id, ...)
  │ 1:1
  │
analysis_images (analysis_id, ...)

-- Notifications (Bonus)
disease_analysis (analysis_id, ...)
  │ 1:N
  │
disease_notifications (analysis_id, ...)
```

## Performance Considerations

1. **Database Indexing**
   - `disease_analysis.user_id` - for user queries
   - `disease_analysis.parcel_id` - for parcel queries
   - `disease_analysis.created_at` - for sorting

2. **Caching Strategy**
   - Cache disease statistics (TTL: 1 hour)
   - Cache recommendation mappings (in memory)

3. **File Storage**
   - Store in `uploads/diseases/` directory
   - Use CDN for image serving in production
   - Implement cleanup job for old analyses

4. **API Rate Limiting**
   - Limit image uploads: 10/minute per user
   - Limit history queries: 30/minute
   - Hugging Face API: 5/minute (free tier)

## Security Considerations

1. **File Upload Security**
   - Validate MIME types (whitelist: jpeg, png)
   - Validate file sizes (max 5MB)
   - Scan for malicious content (optional)

2. **Database Security**
   - Use parameterized queries (prevent SQL injection)
   - Encrypt sensitive fields
   - Set user_id from auth middleware (prevent authorization bypass)

3. **API Security**
   - All endpoints require Bearer token (except health)
   - CORS configured for frontend origin
   - Request validation on all inputs

4. **Sensitive Data**
   - Never log API keys
   - Mask error messages in production
   - Use HTTPS in production
