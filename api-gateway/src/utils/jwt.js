const jwt = require('jsonwebtoken');

/**
 * Verify a JWT token (used in gateway)
 */
const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    console.log(`[JWT] Verifying token with secret: ${secret ? 'SET' : 'NOT SET'}`);
    if (!secret) {
      console.log(`[JWT] JWT_SECRET is undefined. Process.env.JWT_SECRET = ${process.env.JWT_SECRET}`);
      throw new Error('JWT_SECRET not configured');
    }
    const decoded = jwt.verify(token, secret);
    console.log(`[JWT] Token verified successfully`);
    return decoded;
  } catch (error) {
    console.log(`[JWT] Verification failed - Error: ${error.message}, Name: ${error.name}`);
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  verifyToken,
};
