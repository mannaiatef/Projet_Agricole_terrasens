# Crop Calendar Service 🌱

A microservice for generating dynamic agricultural calendars based on crop stages, designed for the Terrasens platform.

## Features

- **Dynamic Calendar Generation**: Create crop calendars based on crop stages and sowing dates
- **Stage Management**: Detailed crop stages with duration and water coefficient (Kc) values
- **Action Tracking**: Associated actions for each stage (irrigation, fertilization, treatment, etc.)
- **JWT Authentication**: Secure endpoints with JWT-based authentication
- **MySQL Database**: Persistent data storage with comprehensive schema
- **Clean Architecture**: Repository → Service → Controller pattern for maintainability

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 5.7+
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up database
npm run setup-db

# Seed initial data with crop stages and actions
npm run seed

# Start the service
npm start
```

### Development

```bash
# Start with hot-reload using nodemon
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=3003
NODE_ENV=development

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=terrasens_calendar

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## API Endpoints

### Public Endpoints

#### Get All Crops
```
GET /calendar/crops
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Wheat",
      "duration_days": 150,
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-01T10:00:00Z"
    }
  ]
}
```

#### Get Crop with Stages and Actions
```
GET /calendar/crops/:crop_id
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Wheat",
    "duration_days": 150,
    "stages": [
      {
        "id": 1,
        "name": "Germination",
        "stage_order": 1,
        "duration_days": 10,
        "kc_value": 0.3,
        "actions": [
          {
            "id": 1,
            "type": "irrigation",
            "title": "Initial Watering",
            "description": "...",
            "frequency": "once",
            "priority": "high"
          }
        ]
      }
    ]
  }
}
```

### Protected Endpoints (Requires JWT Token)

#### Generate Calendar
```
POST /calendar/generate
Authorization: Bearer <token>

Request Body:
{
  "parcelle_id": 1,
  "crop_id": 1,
  "sowing_date": "2026-04-01"
}
```

Response:
```json
{
  "success": true,
  "message": "Calendar generated successfully",
  "data": {
    "id": 1,
    "parcelle_id": 1,
    "crop_id": 1,
    "crop_name": "Wheat",
    "sowing_date": "2026-04-01",
    "total_duration_days": 150,
    "stages": [
      {
        "id": 1,
        "stage_id": 1,
        "stage_name": "Germination",
        "stage_order": 1,
        "start_date": "2026-04-01",
        "end_date": "2026-04-10",
        "duration_days": 10,
        "kc_value": 0.3,
        "actions": []
      }
    ]
  }
}
```

#### Get Calendar by ID
```
GET /calendar/:id
Authorization: Bearer <token>
```

#### Get Calendars for a Parcelle
```
GET /calendar/parcelle/:parcelle_id
Authorization: Bearer <token>
```

## Database Schema

### crops
```sql
- id (INT, PRIMARY KEY)
- name (VARCHAR(255), UNIQUE)
- duration_days (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### stages
```sql
- id (INT, PRIMARY KEY)
- crop_id (INT, FOREIGN KEY)
- name (VARCHAR(255))
- stage_order (INT)
- duration_days (INT)
- kc_value (DECIMAL(3, 2))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### actions
```sql
- id (INT, PRIMARY KEY)
- stage_id (INT, FOREIGN KEY)
- type (VARCHAR(50))  -- irrigation, fertilization, treatment, monitoring, harvesting, etc
- title (VARCHAR(255))
- description (TEXT)
- how_to (TEXT)
- frequency (VARCHAR(50))  -- daily, weekly, once, every-3-4-days, etc
- priority (VARCHAR(20))  -- high, medium, low
- alert_message (VARCHAR(255))
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### calendars
```sql
- id (INT, PRIMARY KEY)
- parcelle_id (INT)
- crop_id (INT, FOREIGN KEY)
- sowing_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### calendar_stages
```sql
- id (INT, PRIMARY KEY)
- calendar_id (INT, FOREIGN KEY)
- stage_id (INT, FOREIGN KEY)
- start_date (DATE)
- end_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Included Crops

The seed data includes three complete crop calendars with stages and actions:

### 1. **Wheat** (150 days total)
- Germination (10 days) - Kc: 0.3
- Tillering (30 days) - Kc: 0.4
- Stem Elongation (35 days) - Kc: 0.8
- Flowering/Anthesis (15 days) - Kc: 1.0
- Grain Filling (40 days) - Kc: 0.9
- Maturity (20 days) - Kc: 0.2

### 2. **Maize** (140 days total)
- Germination & Emergence (12 days) - Kc: 0.3
- Seedling & Vegetative (25 days) - Kc: 0.5
- Mid-Season Growth (35 days) - Kc: 0.8
- Tassel & Pollination (20 days) - Kc: 1.0
- Grain Development (35 days) - Kc: 0.85
- Maturity & Harvest (13 days) - Kc: 0.2

### 3. **Tomato** (120 days total)
- Germination (8 days) - Kc: 0.3
- Seedling Stage (15 days) - Kc: 0.4
- Transplanting (20 days) - Kc: 0.5
- Vegetative Growth (25 days) - Kc: 0.6
- Flowering (20 days) - Kc: 0.85
- Fruit Development & Ripening (32 days) - Kc: 0.9

Each stage includes specific actions with recommendations for irrigation, fertilization, pest/disease management, and harvest timing.

## Architecture

```
crop-calendar-service/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection and initialization
│   ├── entities/
│   │   ├── crop.entity.js
│   │   ├── stage.entity.js
│   │   ├── action.entity.js
│   │   ├── calendar.entity.js
│   │   └── calendar-stage.entity.js
│   ├── repositories/          # Data access layer
│   │   ├── crop.repository.js
│   │   ├── stage.repository.js
│   │   ├── action.repository.js
│   │   ├── calendar.repository.js
│   │   └── calendar-stage.repository.js
│   ├── services/              # Business logic layer
│   │   └── calendar.service.js
│   ├── controllers/           # Request handling layer
│   │   └── calendar.controller.js
│   ├── routes/                # API routes
│   │   └── calendar.routes.js
│   ├── middlewares/
│   │   └── auth.middleware.js
│   ├── utils/
│   │   └── jwt.js
│   └── app.js                 # Express app setup
├── seeds/
│   └── seed.js               # Database seeding script
├── package.json
├── .env                      # Environment configuration
├── setup-db.js              # Database creation script
└── README.md
```

## Integration with API Gateway

The API Gateway routes calendar requests to this service:

```
POST /api/calendar/generate → crop-calendar-service:3003/calendar/generate
GET  /api/calendar/:id       → crop-calendar-service:3003/calendar/:id
GET  /api/calendar/parcelle/:parcelle_id → crop-calendar-service:3003/calendar/parcelle/:parcelle_id
GET  /api/crops              → crop-calendar-service:3003/calendar/crops
GET  /api/crops/:crop_id     → crop-calendar-service:3003/calendar/crops/:crop_id
```

## Future Enhancements

- **Water Stress Detection**: AI-based water stress prediction
- **Irrigation Recommendations**: Smart irrigation scheduling
- **Weather Integration**: Real-time weather data integration
- **Yield Prediction**: Machine learning-based yield forecasting
- **Mobile App**: Native mobile application for on-field access
- **IoT Integration**: Sensor data integration for real-time monitoring
- **Multi-Language Support**: Localization for different regions

## License

ISC
