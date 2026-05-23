# 🔐 Auth Service

User authentication microservice for the Terrasens platform.

## Features

- ✅ User registration with email validation
- ✅ User login with password verification
- ✅ JWT token generation and verification
- ✅ Password hashing with bcrypt
- ✅ User profile retrieval
- ✅ Protected routes with middleware
- ✅ CORS support
- ✅ Comprehensive error handling

## Prerequisites

- Node.js 18 or higher
- MySQL 5.7 or higher
- npm

## Installation

```bash
cd auth-service
npm install
```

## Configuration

Update the `.env` file with your database credentials:

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=terrasens_auth
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=7d
GATEWAY_URL=http://localhost:3000
```

## Running the Service

### Development Mode
```bash
npm run dev
```

The service will start on `http://localhost:3001` and automatically create the users table if it doesn't exist.

### Production Mode
```bash
npm start
```

## API Endpoints

### Public Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Farmer",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Farmer",
      "email": "john@example.com",
      "role": "farmer",
      "createdAt": "2024-03-31T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Farmer",
      "email": "john@example.com",
      "role": "farmer",
      "createdAt": "2024-03-31T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Verify Token
```
POST /auth/verify
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "role": "farmer",
      "iat": 1711881600,
      "exp": 1712486400
    }
  }
}
```

### Protected Endpoints

#### Get User Profile
```
GET /auth/profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Farmer",
      "email": "john@example.com",
      "role": "farmer",
      "createdAt": "2024-03-31T00:00:00.000Z",
      "updatedAt": "2024-03-31T00:00:00.000Z"
    }
  }
}
```

#### Health Check
```
GET /health
```

**Response (200):**
```json
{
  "success": true,
  "message": "Auth Service is running",
  "timestamp": "2024-03-31T00:00:00.000Z"
}
```

## Error Responses

### Invalid Email or Password
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Email Already Exists
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### Missing Required Fields
```json
{
  "success": false,
  "message": "Name, email, and password are required"
}
```

### Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'farmer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Project Structure

```
auth-service/
├── src/
│   ├── config/
│   │   └── db.js                 # Database configuration and initialization
│   ├── entities/
│   │   └── user.entity.js        # User model/entity
│   ├── repositories/
│   │   └── user.repository.js    # Database access layer
│   ├── services/
│   │   └── auth.service.js       # Business logic
│   ├── controllers/
│   │   └── auth.controller.js    # Request handlers
│   ├── routes/
│   │   └── auth.routes.js        # Route definitions
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT verification middleware
│   ├── utils/
│   │   ├── hash.js               # Password hashing utilities
│   │   └── jwt.js                # JWT utilities
│   └── app.js                    # Express app setup
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Architecture

### Three-Layer Architecture

1. **Controller Layer**
   - Handles HTTP requests and responses
   - Validates input
   - Calls service layer

2. **Service Layer**
   - Contains business logic
   - Validates data
   - Calls repository layer
   - Returns formatted responses

3. **Repository Layer**
   - Direct database access
   - CRUD operations
   - Prepared statements for security

### Flow Diagram

```
Request → Controller → Service → Repository → Database
Response ← Controller ← Service ← Repository ← Database
```

## Testing with curl

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Farmer","email":"john@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"password123"}'

# Verify Token (replace with actual token)
curl -X POST http://localhost:3001/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get Profile (replace with actual token)
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Health Check
curl http://localhost:3001/health
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 3001 |
| NODE_ENV | Environment mode | development |
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | root |
| DB_NAME | Database name | terrasens_auth |
| JWT_SECRET | JWT signing key | (required) |
| JWT_EXPIRATION | Token expiration | 7d |
| GATEWAY_URL | API Gateway URL | http://localhost:3000 |

## Dependencies

- **express**: Web framework
- **mysql2**: MySQL client
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT handling
- **dotenv**: Environment variables
- **cors**: Cross-Origin Resource Sharing
- **morgan**: HTTP request logger

## Development

### Running Tests

```bash
# Unit tests (setup in package.json)
npm test
```

### Code Quality

The code follows these best practices:

- ✅ Async/await for asynchronous operations
- ✅ Error handling with try-catch
- ✅ Input validation
- ✅ Prepared statements for SQL injection prevention
- ✅ CORS configuration for security
- ✅ Environment-based configuration
- ✅ Clear separation of concerns

## Security Considerations

1. **Password Security**
   - Passwords are hashed with bcrypt (salt rounds: 10)
   - Never return plaintext passwords

2. **Token Security**
   - JWT tokens signed with secret key
   - Tokens expire after configured duration
   - Tokens are verified on protected routes

3. **Database Security**
   - Prepared statements prevent SQL injection
   - Email field is unique to prevent duplicates
   - Passwords are not selected in queries when possible

4. **HTTP Security**
   - CORS is configured to allow specific origins
   - HTTP status codes follow REST conventions

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check credentials in .env file
- Verify database exists

### Port Already in Use
```bash
# Change PORT in .env
PORT=3002
```

### JWT Token Expired
- Request a new token by logging in again
- Adjust JWT_EXPIRATION in .env if needed

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Rate limiting per IP
- [ ] User profile update endpoint
- [ ] Role-based access control (RBAC)
- [ ] Unit and integration tests
- [ ] OpenAPI/Swagger documentation
- [ ] Request logging and monitoring

## Support

For issues or questions, please check the main [README.md](../README.md) or contact the development team.

---

**Happy authentication! 🔐**
