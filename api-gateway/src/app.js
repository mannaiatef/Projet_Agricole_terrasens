const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const authMiddleware = require('./middlewares/auth.middleware');
const authRoutes = require('./routes/auth.routes');
const cropsRoutes = require('./routes/calendar.routes');
const calendarProtectedRoutes = require('./routes/calendar-protected.routes');
const fieldsRoutes = require('./routes/fields-proxy.routes');
const irrigationProxyRoutes = require('./routes/irrigation-proxy.routes');
const stressProxyRoutes = require('./routes/stress-proxy.routes');
const diseaseDetectionProxyRoutes = require('./routes/disease-detection-proxy.routes');
const chatbotProxyRoutes = require('./routes/chatbot-proxy.routes');

const app = express();

// Set timeout limits
app.use((req, res, next) => {
  res.setTimeout(120000); // 120 second timeout for responses (supports slow LLM models)
  next();
});

// Middleware
app.use(cors());
app.use(morgan('dev'));

// Auth routes FIRST (before body parser) - proxy needs raw stream
app.use('/api/auth', authRoutes);

// Proxy routes (BEFORE body parser - they need raw stream)
app.use('/api/chat', authMiddleware, chatbotProxyRoutes);
app.use('/api/irrigation', authMiddleware, irrigationProxyRoutes);
app.use('/api/stress', stressProxyRoutes);
app.use('/api/v1/disease', diseaseDetectionProxyRoutes);

// Parse body ONLY for non-proxy routes  
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Other routes (after body parser)
// Routes
app.use('/api/crops', cropsRoutes);
app.use('/api/fields', authMiddleware, fieldsRoutes);
app.use('/api/parcelles', authMiddleware, require('./routes/parcelle-proxy.routes'));
app.use('/api/calendar', calendarProtectedRoutes);

// Health check endpoint (no authentication needed)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      calendar: process.env.CALENDAR_SERVICE_URL,
      irrigation: process.env.IRRIGATION_SERVICE_URL,
      stress: process.env.STRESS_SERVICE_URL,
      chatbot: process.env.CHATBOT_SERVICE_URL,
      diseaseDetection: process.env.DISEASE_DETECTION_SERVICE_URL,
    },
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Terrasens API Gateway',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 API Gateway is running on port ${PORT}`);
  console.log(`📝 API Endpoints:`);
  console.log(`   POST   /api/auth/register              - Register a new user`);
  console.log(`   POST   /api/auth/login                 - Login user`);
  console.log(`   POST   /api/auth/verify                - Verify JWT token`);
  console.log(`   GET    /api/auth/profile               - Get user profile (protected)`);
  console.log(`\n🌾 Crops Service:`);
  console.log(`   GET    /api/crops                      - Get all crops`);
  console.log(`   GET    /api/crops/:id                  - Get crop by ID`);
  console.log(`\n🌾 Fields Service (protected):`);
  console.log(`   GET    /api/fields                     - Get all fields`);
  console.log(`   GET    /api/fields/:id                 - Get field by ID`);
  console.log(`   POST   /api/fields/sync-all            - Sync all fields`);
  console.log(`   POST   /api/fields/:id/irrigate        - Irrigate a field`);
  console.log(`\n📍 Parcelles Service (protected):`);
  console.log(`   GET    /api/parcelles                  - Get all parcelles`);
  console.log(`   POST   /api/parcelles                  - Create new parcelle`);
  console.log(`   GET    /api/parcelles/:id              - Get parcelle by ID`);
  console.log(`   PUT    /api/parcelles/:id              - Update parcelle`);
  console.log(`   DELETE /api/parcelles/:id              - Delete parcelle`);
  console.log(`   POST   /api/parcelles/:id/assign-crop  - Assign crop to parcelle`);
  console.log(`\n📅 Calendar Service (protected):`);
  console.log(`   GET    /api/calendar/:id               - Get calendar by ID`);
  console.log(`   GET    /api/calendar/parcelle/:id      - Get calendar for parcelle`);
  console.log(`   POST   /api/calendar/generate          - Generate calendar`);
  console.log(`\n🌱 Stress Service (vegetation detection):`);
  console.log(`   POST   /api/stress/analyze             - Trigger stress analysis`);
  console.log(`   GET    /api/stress/jobs/:jobId         - Monitor analysis job`);
  console.log(`   GET    /api/stress/parcel/:id/latest   - Get latest analysis`);
  console.log(`   GET    /api/stress/parcel/:id/alerts   - Get parcel alerts`);
  console.log(`   PUT    /api/stress/alerts/:id/acknowledge - Acknowledge alert`);
  console.log(`   POST   /api/stress/analyze-bulk        - Batch analysis`);
  console.log(`   GET    /api/stress/queue/stats         - Queue statistics`);
  console.log(`\n🦠 Disease Detection Service (protected):`);
  console.log(`   POST   /api/v1/disease/analyze         - Upload & analyze crop image`);
  console.log(`   GET    /api/v1/disease/history         - Get analysis history`);
  console.log(`   GET    /api/v1/disease/analysis/:id    - Get single analysis`);
  console.log(`   GET    /api/v1/disease/parcel/:id      - Get parcel analyses`);
  console.log(`   GET    /api/v1/disease/statistics      - Get disease statistics`);
  console.log(`   GET    /api/v1/disease/high-risk       - Get high-confidence detections`);
  console.log(`   DELETE /api/v1/disease/analysis/:id    - Delete analysis`);
  console.log(`   GET    /api/v1/disease/health          - Service health check`);
  console.log(`\n   GET    /health                         - Health check (all services)\n`);
});

module.exports = app;
