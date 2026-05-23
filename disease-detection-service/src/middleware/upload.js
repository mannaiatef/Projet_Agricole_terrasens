const multer = require('multer');
const path = require('path');

/**
 * Configure multer storage for image uploads
 */
const storage = multer.memoryStorage(); // Store in memory for processing

/**
 * File filter for image uploads
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG and PNG allowed.`), false);
  }
};

/**
 * Configure multer middleware
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * Single file upload middleware
 */
const uploadSingleImage = upload.single('image');

/**
 * Error handler middleware for multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit'
        }
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Only one image allowed per request'
        }
      });
    }
  }

  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_IMAGE',
        message: err.message || 'Invalid image file'
      }
    });
  }

  next();
};

module.exports = {
  uploadSingleImage,
  handleUploadError
};
