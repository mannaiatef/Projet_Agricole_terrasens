/**
 * AUTH MIDDLEWARE
 * 
 * Validates JWT tokens on protected endpoints.
 * Extracts user information from token for authorization checks.
 */

const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT token and extract user info
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Use Authorization: Bearer <token>',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify JWT token
    const decoded = verifyToken(token);

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Export for verification in services
 */
function verifyJWT(token) {
  return verifyToken(token);
}

module.exports = authMiddleware;
module.exports.verifyJWT = verifyJWT;
