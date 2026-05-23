/**
 * Authentication Middleware
 * Validates JWT token from Authorization header
 */

/**
 * Check if user is authenticated
 * Validates Bearer token
 */
const verifyAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header with Bearer token required'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // For now, we'll extract user ID from token header
    // In production, validate with Auth Service
    req.userId = req.headers['x-user-id'];

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
    }

    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that have both public and authenticated versions
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    req.userId = req.headers['x-user-id'];
    req.token = token;
  }

  next();
};

module.exports = {
  verifyAuth,
  optionalAuth
};
