const { verifyToken } = require('../utils/jwt');

/**
 * Middleware to verify JWT token for protected routes
 */
const authMiddleware = (req, res, next) => {
  try {
    console.log(`[Auth Middleware] Full request - Method: ${req.method}, URL: ${req.url}, Path: ${req.path}, BaseURL: ${req.baseUrl}`);
    
    // Allow public auth routes (register and login don't require authentication)
    if (
      req.path === '/auth/register' ||
      req.path === '/auth/login' ||
      req.path === '/auth/verify'
    ) {
      return next();
    }

    const authHeader = req.headers.authorization;
    console.log(`[Auth Middleware] Authorization header present: ${!!authHeader}`);
    
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log(`[Auth Middleware] No token found in Authorization header`);
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    console.log(`[Auth Middleware] Token found, attempting verification...`);
    const decoded = verifyToken(token);
    console.log(`[Auth Middleware] Token verified successfully for user ${decoded.email}`);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(`[Auth Middleware] Error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};


module.exports = authMiddleware;
