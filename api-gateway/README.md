# 🌐 API Gateway

Central entry point for all Terrasens microservices.

## Features

- ✅ Route forwarding to microservices
- ✅ JWT token verification middleware
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS support
- ✅ Request logging with Morgan
- ✅ Health check endpoint
- ✅ Error handling and response formatting

## Prerequisites

- Node.js 18 or higher
- npm

## Installation

```bash
cd api-gateway
npm install
```

## Configuration

Update the `.env` file with service URLs:

```env
PORT=3000
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:3001
JWT_SECRET=your-secret-key-change-in-production
```

## Running the Service

### Development Mode
```bash
npm run dev
```

The gateway will start on `http://localhost:3000`

### Production Mode
```bash
npm start
```

## API Endpoints

The gateway proxy all requests to the Auth Service:

### Authentication Routes

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Farmer",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Verify Token
```
POST /api/auth/verify
Authorization: Bearer {token}
```

#### Get User Profile (Protected)
```
GET /api/auth/profile
Authorization: Bearer {token}
```

### Gateway Routes

#### Health Check
```
GET /health
```

Response:
```json
{
  "success": true,
  "message": "API Gateway is running",
  "timestamp": "2024-03-31T00:00:00.000Z",
  "services": {
    "auth": "http://localhost:3001"
  }
}
```

#### Welcome Endpoint
```
GET /
```

Response:
```json
{
  "success": true,
  "message": "Welcome to Terrasens API Gateway",
  "version": "1.0.0",
  "documentation": "/api-docs"
}
```

## Gateway Features

### Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Window**: 15 minutes
- **Message**: "Too many requests from this IP, please try again later."

### Authentication Middleware

- Verifies JWT tokens on protected routes
- Allows public auth routes (register, login)
- Adds user info to request on protected routes

### CORS Configuration

- Allows requests from all origins
- Supports credentials

### Request Logging

- Logs all HTTP requests using Morgan
- Format: `dev` (colorized development format)

## Project Structure

```
api-gateway/
├── src/
│   ├── routes/
│   │   └── auth.routes.js        # Auth service routes
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT verification middleware
│   ├── proxy/
│   │   └── auth.proxy.js         # HTTP proxy for auth-service
│   ├── utils/
│   │   └── jwt.js                # JWT utilities
│   └── app.js                    # Express app setup
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Architecture

### Request Flow

```
Client Request
    ↓
API Gateway (Port 3000)
    ↓
Authentication Middleware (verify JWT)
    ↓
Route Handler
    ↓
HTTP Proxy (http-proxy)
    ↓
Microservice (Auth Service on Port 3001)
    ↓
Response → Client
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Gateway port | 3000 |
| NODE_ENV | Environment mode | development |
| AUTH_SERVICE_URL | Auth service URL | http://localhost:3001 |
| JWT_SECRET | JWT signing key | (required) |

## Dependencies

- **express**: Web framework
- **cors**: Cross-Origin Resource Sharing
- **morgan**: HTTP request logger
- **http-proxy**: HTTP proxy for service forwarding
- **dotenv**: Environment variables
- **jsonwebtoken**: JWT handling
- **express-rate-limit**: Rate limiting middleware

## Testing

### Test with curl

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Farmer","email":"john@gateway.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@gateway.com","password":"password123"}'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"

# Health Check
curl http://localhost:3000/health

# Welcome
curl http://localhost:3000/
```

## Error Handling

### Service Unavailable (503)
```json
{
  "success": false,
  "message": "Auth service is temporarily unavailable"
}
```

### Endpoint Not Found (404)
```json
{
  "success": false,
  "message": "Endpoint not found",
  "path": "/api/unknown"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Rate Limit Exceeded (429)
```
Too many requests from this IP, please try again later.
```

## Middleware

### Authentication Middleware

Located in `src/middlewares/auth.middleware.js`

- Verifies JWT tokens
- Allows public routes: `/auth/register`, `/auth/login`
- Returns 401 for missing or invalid tokens

### Rate Limiting

- Applied globally
- Limits: 100 requests per 15 minutes per IP

### CORS

- Allows all origins
- Supports credentials

### Logging

- Morgan development format
- Logs to console

## Scaling Considerations

### Adding New Services

1. Create a new proxy in `src/proxy/`
2. Add routes in a new file in `src/routes/`
3. Mount routes in `app.js`

Example:
```javascript
// src/proxy/product.proxy.js
const productProxy = httpProxy.createProxyServer({
  target: process.env.PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/products',
  },
});

// src/routes/product.routes.js
router.post('/', (req, res) => productProxy.web(req, res));

// In app.js
const productRoutes = require('./routes/product.routes');
app.use('/api/products', productRoutes);
```

## Security Best Practices

✅ **Implemented:**
- JWT token verification
- CORS configuration
- Rate limiting
- Error message sanitization
- Environment-based configuration

⚠️ **To Consider:**
- HTTPS in production
- WAF (Web Application Firewall)
- Request validation
- API key management
- Monitoring and alerting

## Monitoring

### Health Checks

The gateway provides health check endpoints:
- `GET /health` - Gateway health
- Check individual services via their health endpoints

### Logging

All requests are logged with Morgan:
```
POST /api/auth/login 200 1.234 ms - 256
```

## Troubleshooting

### Service Connection Failed
- Ensure Auth Service is running
- Check AUTH_SERVICE_URL in .env
- Verify port 3001 is accessible

### Port Already in Use
```bash
# Change PORT in .env
PORT=3002
```

### Rate Limiting Too Strict

Adjust in `src/app.js`:
```javascript
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes
  max: 200,                   // 200 requests
});
```

## Future Enhancements

- [ ] Add caching layer (Redis)
- [ ] Implement circuit breaker pattern
- [ ] Add request validation schema
- [ ] Implement service discovery
- [ ] Add comprehensive logging
- [ ] API versioning support
- [ ] WebSocket support
- [ ] GraphQL endpoint
- [ ] API documentation (Swagger)
- [ ] Metrics collection (Prometheus)

## Performance Tips

1. **Caching**
   - Implement Redis for frequently accessed data
   - Cache health check results

2. **Connection Pooling**
   - Already implemented in database layer

3. **Logging**
   - Consider using structured logging in production
   - Use log aggregation tools

4. **Monitoring**
   - Set up alerts for service failures
   - Monitor response times

## Support

For issues or questions, please check the main [README.md](../README.md) or contact the development team.

---

**Gateway ready to route! 🌐**
