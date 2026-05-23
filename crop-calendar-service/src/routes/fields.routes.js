const express = require('express');
const fieldsController = require('../controllers/fields.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// All fields routes require authentication
router.use(authMiddleware);

/**
 * GET /fields
 * Get all fields for the authenticated user
 */
router.get('/', fieldsController.getFields);

/**
 * POST /fields/sync-all
 * Sync all fields with external data (must come before /:id routes)
 */
router.post('/sync-all', fieldsController.syncAllFields);

/**
 * GET /fields/:id
 * Get a single field by ID
 */
router.get('/:id', fieldsController.getFieldById);

/**
 * POST /fields/:id/irrigate
 * Irrigate a field
 */
router.post('/:id/irrigate', fieldsController.irrigateField);

module.exports = router;
