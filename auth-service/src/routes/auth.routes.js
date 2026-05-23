const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * Public Routes
 */

// Register
router.post('/register', (req, res) => authController.register(req, res));

// Login
router.post('/login', (req, res) => authController.login(req, res));

// Auto-login (creates user if not exists)
router.post('/login-auto', (req, res) => authController.loginAuto(req, res));

// Verify token
router.post('/verify', (req, res) => authController.verify(req, res));

/**
 * Protected Routes
 */

// Get profile (requires authentication)
router.get('/profile', authMiddleware, (req, res) => authController.getProfile(req, res));

module.exports = router;
