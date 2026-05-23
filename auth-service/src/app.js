const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { initializeDatabase } = require('./config/db');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth Service is running',
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
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initializeDatabase();
    console.log('✓ Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`\n🚀 Auth Service is running on port ${PORT}`);
      console.log(`📝 API Documentation:`);
      console.log(`   POST   /auth/register    - Register a new user`);
      console.log(`   POST   /auth/login       - Login user`);
      console.log(`   POST   /auth/login-auto  - Auto-login (creates user if not exists)`);
      console.log(`   POST   /auth/verify      - Verify JWT token`);
      console.log(`   GET    /auth/profile     - Get user profile (protected)`);
      console.log(`   GET    /health           - Health check\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
