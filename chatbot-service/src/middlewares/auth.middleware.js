const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    console.log('[Auth Middleware] Token verification started');
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('[Auth Middleware] No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    console.log('[Auth Middleware] Token found, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'terrasens_jwt_secret_key_production');
    req.userId = decoded.userId || decoded.id;
    req.user = decoded;
    console.log('[Auth Middleware] Token verified for userId:', req.userId);

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
