const express = require('express');
const parcelleController = require('../controllers/parcelle.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

console.log('[ParcelleRoutes] Loading parcelle routes...');
console.log('[ParcelleRoutes] Controller:', typeof parcelleController);
console.log('[ParcelleRoutes] Controller.assignCrop:', typeof parcelleController.assignCrop);

/**
 * UNAUTHENTICATED ROUTES FOR SERVICE-TO-SERVICE COMMUNICATION
 * These routes bypass authentication for internal microservice calls (stress-service)
 */

/**
 * GET /parcelles/internal/:id
 * Internal endpoint: Get parcel data without authentication (for stress service)
 */
router.get('/internal/:id', parcelleController.getParcelleByIdInternal);

/**
 * GET /parcelles/internal
 * Internal endpoint: Get all parcelles without authentication (for stress service bulk operations)
 */
router.get('/internal', parcelleController.getParcellesInternal);

// All other parcelle routes require authentication
router.use(authMiddleware);
console.log('[ParcelleRoutes] Auth middleware registered');

/**
 * GET /parcelles
 * Get all parcelles for the authenticated user
 */
router.get('/', parcelleController.getParcelles);

/**
 * POST /parcelles
 * Create a new parcelle
 */
router.post('/', parcelleController.createParcelle);

/**
 * POST /parcelles/:id/assign-crop
 * Assign a crop to a parcelle (MUST come before /:id routes)
 */
console.log('[ParcelleRoutes] Registering POST /:id/assign-crop route');
router.post('/:id/assign-crop', (req, res, next) => {
  console.log('[ParcelleRoutes] POST /:id/assign-crop matched!');
  console.log('[ParcelleRoutes] Path:', req.path, 'Params:', req.params);
  parcelleController.assignCrop(req, res, next);
});

/**
 * POST /parcelles/:id/calendar/generate
 * Generate calendar for a parcelle
 */
console.log('[ParcelleRoutes] Registering POST /:id/calendar/generate route');
router.post('/:id/calendar/generate', (req, res, next) => {
  console.log('[ParcelleRoutes] POST /:id/calendar/generate matched!');
  console.log('[ParcelleRoutes] Path:', req.path, 'Params:', req.params);
  parcelleController.generateCalendarForParcelle(req, res, next);
});

/**
 * GET /parcelles/:id
 * Get a single parcelle by ID
 */
router.get('/:id', parcelleController.getParcelleById);

/**
 * PUT /parcelles/:id
 * Update a parcelle
 */
router.put('/:id', parcelleController.updateParcelle);

/**
 * DELETE /parcelles/:id
 * Delete a parcelle
 */
router.delete('/:id', parcelleController.deleteParcelle);

module.exports = router;
