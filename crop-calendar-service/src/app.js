const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');
const cropsRoutes = require('./routes/crops.routes');
const parcelleRoutes = require('./routes/parcelle.routes');
const fieldsRoutes = require('./routes/fields.routes');
const calendarRoutes = require('./routes/calendar.routes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/crops', cropsRoutes);
app.use('/parcelles', parcelleRoutes);
app.use('/fields', fieldsRoutes);
app.use('/calendar', calendarRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Crop Calendar Service is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`✓ Crop Calendar Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
