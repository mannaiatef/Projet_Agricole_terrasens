require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const Database = require('./config/database');
const DiseaseAnalysisController = require('./controllers/DiseaseAnalysisController');
const { uploadSingleImage, handleUploadError } = require('./middleware/upload');
const { verifyAuth } = require('./middleware/auth');

/**
 * Initialize Express application
 */
const app = express();

/**
 * Middleware Setup
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded images as static files
app.use('/uploads', express.static('uploads'));

/**
 * Routes
 */

// Health check
app.get('/health', DiseaseAnalysisController.health);
app.get('/api/v1/disease/health', DiseaseAnalysisController.health);

// Public routes
app.post(
  '/api/v1/disease/analyze',
  uploadSingleImage,
  handleUploadError,
  verifyAuth,
  DiseaseAnalysisController.analyzeImage
);

// Protected routes (requires authentication)
app.get(
  '/api/v1/disease/history',
  verifyAuth,
  DiseaseAnalysisController.getHistory
);

app.get(
  '/api/v1/disease/analysis/:analysisId',
  DiseaseAnalysisController.getAnalysis
);

app.get(
  '/api/v1/disease/parcel/:parcelId',
  DiseaseAnalysisController.getParcelAnalyses
);

app.get(
  '/api/v1/disease/statistics',
  verifyAuth,
  DiseaseAnalysisController.getStatistics
);

app.get(
  '/api/v1/disease/high-risk',
  verifyAuth,
  DiseaseAnalysisController.getHighRiskAnalyses
);

app.delete(
  '/api/v1/disease/analysis/:analysisId',
  verifyAuth,
  DiseaseAnalysisController.deleteAnalysis
);

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * Initialize and start server
 */
const PORT = process.env.PORT || 3005;

async function startServer() {
  try {
    // Initialize database connection pool
    await Database.initialize();

    // Start listening
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║   🌱 Disease Detection Service Running        ║
║   Port: ${PORT}                                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                 ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM signal received. Closing server...');
  await Database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT signal received. Closing server...');
  await Database.close();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
