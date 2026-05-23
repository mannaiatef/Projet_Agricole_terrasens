# TerraSens Chatbot Service

🤖 AI-powered chatbot microservice for the TerraSens smart agriculture platform. Acts as an intelligent agent to route user requests to appropriate backend microservices.

## Features

✅ **AI Agent Architecture** - Intelligent routing of user requests to microservices
✅ **Gemini LLM Integration** - Advanced language understanding and natural language processing
✅ **Tool-Based System** - Modular tools for different agricultural operations
✅ **Image Analysis** - Plant disease detection from crop images
✅ **Conversation Memory** - Persistent chat history with context awareness
✅ **Multilingual Support** - Arabic, French, and English support
✅ **JWT Authentication** - Secure endpoints with token-based auth
✅ **Real-time Processing** - Fast responses with async operations

## Architecture

```
┌─────────────────┐
│  Frontend (UI)  │
└────────┬────────┘
         │
┌────────▼────────────────┐
│  API Gateway            │ ◄─ Routes requests
└────────┬────────────────┘
         │
┌────────▼──────────────────┐
│  Chatbot Service          │ ◄─ AI Agent
├──────────────────────────┤
│ • LLM Service (Gemini)   │
│ • Tool Executor          │
│ • Chat Service           │
│ • Conversation Storage   │
└────────┬──────────────────┘
         │
    ┌────┴──────────────────────────────┐
    │                                    │
┌───▼──────────┐  ┌─────────────────┐  ┌─▼──────────────┐
│ Stress       │  │ Irrigation      │  │ Disease        │
│ Service      │  │ Service         │  │ Detection      │
└──────────────┘  │                 │  │                │
                  │ Crop Calendar   │  │                │
                  │ Service         │  │                │
                  └─────────────────┘  └────────────────┘
```

## Available Tools

### 1. **getStress(parcelleId)**
Get plant stress analysis for a specific parcel
- Returns: Stress level, NDVI score, recommendations

### 2. **getIrrigationStatus(parcelleId)**
Get irrigation status and recommendations
- Returns: Current moisture, watering schedule, water requirements

### 3. **getCropCalendar(parcelleId)**
Get crop calendar and planting schedule
- Returns: Crop stages, current phase, timeline

### 4. **detectDisease(image)**
Detect plant diseases from uploaded images
- Returns: Disease type, confidence, treatment recommendations

## API Endpoints

### Send Message
```http
POST /chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "What's the stress level in parcel 123?",
  "parcelleId": "123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "response": "Bot response with data",
    "toolsUsed": ["getStress"],
    "timestamp": "2024-04-24T10:30:00Z"
  }
}
```

### Upload Image
```http
POST /chat/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "image": <file>,
  "parcelleId": "123"
}
```

### Get Conversation History
```http
GET /chat/history?limit=50&offset=0
Authorization: Bearer {token}
```

### Clear History
```http
DELETE /chat/history
Authorization: Bearer {token}
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Google Gemini API Key
- Docker (optional)

### Local Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
Create `.env` file with:
```env
PORT=3006
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=terrasens_chatbot

JWT_SECRET=your_secret_key

API_GATEWAY_URL=http://localhost:3000

GEMINI_API_KEY=your_gemini_api_key
```

3. **Run the service:**
```bash
npm run dev
```

### Docker Setup

1. **Build image:**
```bash
docker build -t terrasens-chatbot-service .
```

2. **Run container:**
```bash
docker run -p 3006:3006 \
  -e DB_HOST=mysql \
  -e GEMINI_API_KEY=your_key \
  terrasens-chatbot-service
```

3. **Or with Docker Compose:**
Add to `docker-compose.yml`:
```yaml
chatbot-service:
  build:
    context: ./chatbot-service
    dockerfile: Dockerfile
  container_name: terrasens-chatbot-service
  environment:
    PORT: 3006
    NODE_ENV: production
    DB_HOST: mysql
    DB_USER: root
    DB_PASSWORD: root
    DB_NAME: terrasens_chatbot
    JWT_SECRET: terrasens_jwt_secret_key_production
    API_GATEWAY_URL: http://api-gateway:3000
    GEMINI_API_KEY: your_gemini_api_key
  ports:
    - "3006:3006"
  depends_on:
    mysql:
      condition: service_healthy
  networks:
    - terrasens-network
```

## Chat Examples

### Stress Query (Arabic)
```
User: "chniya stress mta3 parcelle 123?"
Bot: Calls getStress(123) → Returns stress data + recommendations
```

### Irrigation Question
```
User: "When should I water my crops?"
Bot: Calls getIrrigationStatus() → Returns schedule + water requirements
```

### Crop Calendar
```
User: "What stage is my crop at?"
Bot: Calls getCropCalendar() → Returns current phase + timeline
```

### Disease Detection
```
User: [Uploads sick plant image]
Bot: Calls detectDisease() → Returns diagnosis + treatment options
```

## File Structure

```
chatbot-service/
├── src/
│   ├── app.js                    # Express application
│   ├── config/
│   │   └── db.js                 # Database setup
│   ├── controllers/
│   │   └── chat.controller.js    # Request handlers
│   ├── services/
│   │   ├── chat.service.js       # Main chat logic
│   │   ├── llm.service.js        # Gemini integration
│   │   └── tool-executor.service.js  # Tool execution
│   ├── repositories/
│   │   └── conversation.repository.js  # DB operations
│   ├── routes/
│   │   └── chat.routes.js        # API routes
│   ├── models/
│   │   └── Conversation.js       # Database model
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT validation
│   └── utils/
│       ├── apiClient.js          # API Gateway calls
│       └── logger.js             # Logging
├── uploads/                      # Image storage
├── package.json
├── .env
├── Dockerfile
└── README.md
```

## Database Schema

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  userMessage LONGTEXT,
  botResponse LONGTEXT,
  toolsUsed JSON,
  confidence FLOAT,
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_userId (userId),
  INDEX idx_createdAt (createdAt)
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3006 |
| `NODE_ENV` | Environment | production |
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | root |
| `DB_NAME` | Database name | terrasens_chatbot |
| `JWT_SECRET` | JWT secret key | terrasens_jwt_secret_key_production |
| `API_GATEWAY_URL` | API Gateway URL | http://api-gateway:3000 |
| `GEMINI_API_KEY` | Google Gemini API key | required |

## Error Handling

The service implements comprehensive error handling:
- **400**: Bad request (invalid input)
- **401**: Unauthorized (invalid token)
- **404**: Not found
- **500**: Server error

All responses follow this format:
```json
{
  "success": boolean,
  "message": "Error/Success message",
  "data": { /* response data */ }
}
```

## Performance Considerations

- **Conversation History Caching**: Caches last 10 messages for context
- **Tool Parallel Execution**: Executes multiple tools simultaneously when possible
- **Image Compression**: Automatic optimization for large images
- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: MySQL connection pool with 5 max connections

## Security Features

✅ JWT Authentication on all protected endpoints
✅ Input validation and sanitization
✅ File type and size validation for uploads
✅ CORS protection
✅ Environment variable protection (no secrets in code)
✅ SQL injection prevention via Sequelize ORM
✅ XSS protection via JSON responses

## Monitoring & Logging

All operations are logged with timestamps:
- `[INFO]` - Informational messages
- `[ERROR]` - Error conditions
- `[WARN]` - Warnings
- `[DEBUG]` - Debug info (development only)

## Known Limitations

- Image analysis supports JPEG/PNG only
- Max message length: 5000 characters
- Max image size: 25MB
- Conversation history limited to 50 per request (pagination)
- LLM response time depends on Gemini API latency

## Future Enhancements

- [ ] Intent classification with confidence scoring
- [ ] Multi-language conversation switching
- [ ] Voice input support
- [ ] Real-time chat notifications
- [ ] Advanced conversation analytics
- [ ] Custom model fine-tuning
- [ ] Rate limiting and quota management
- [ ] WebSocket support for real-time chat

## Troubleshooting

### "GEMINI_API_KEY not configured"
- Set `GEMINI_API_KEY` in `.env` file
- Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Database connection errors
- Verify MySQL is running and accessible
- Check DB credentials in `.env`
- Ensure database exists: `CREATE DATABASE terrasens_chatbot;`

### Token validation errors
- Verify JWT token is valid and not expired
- Check `JWT_SECRET` matches across services

### Image upload failures
- Check file format (JPEG/PNG only)
- Verify file size < 25MB
- Ensure `/uploads` directory is writable

## Support & Contribution

For issues, questions, or contributions, please refer to the main TerraSens documentation.

## License

ISC

---

**Last Updated**: April 24, 2024
**Version**: 1.0.0
