const express = require('express');
const HealthController = require('../controllers/HealthController');

const router = express.Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', HealthController.healthCheck);

/**
 * GET /health/detailed
 * Detailed health with system status
 */
router.get('/detailed', HealthController.detailedHealth);

/**
 * GET /health/ready
 * Kubernetes readiness probe
 */
router.get('/ready', HealthController.readinessProbe);

/**
 * GET /health/live
 * Kubernetes liveness probe
 */
router.get('/live', HealthController.livenessProbe);

module.exports = router;
