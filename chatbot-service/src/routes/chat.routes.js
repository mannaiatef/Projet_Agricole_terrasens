const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  },
});

// Routes

// Simple test endpoint (for debugging proxy connectivity)
router.post('/test-simple', (req, res) => {
  console.log('[Route] Test simple endpoint called');
  res.status(200).json({
    success: true,
    message: 'Test endpoint working perfectly!',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route POST /chat
 * @desc Send a message to the chatbot
 * @body { message: string, parcelleId?: string }
 */
router.post('/', chatController.sendMessage.bind(chatController));

/**
 * @route POST /chat/image
 * @desc Upload a crop image for disease detection
 * @body FormData { image: File, parcelleId?: string }
 */
router.post('/image', upload.single('image'), chatController.uploadImage.bind(chatController));

/**
 * @route GET /chat/history
 * @desc Get conversation history
 * @query { limit: number, offset: number }
 */
router.get('/history', chatController.getHistory.bind(chatController));

/**
 * @route DELETE /chat/history
 * @desc Clear all conversation history
 */
router.delete('/history', chatController.clearHistory.bind(chatController));

/**
 * @route GET /chat/health
 * @desc Health check
 */
router.get('/health', chatController.health.bind(chatController));

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`,
    });
  }
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
});

module.exports = router;
