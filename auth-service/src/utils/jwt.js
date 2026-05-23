const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate a JWT token
 * @param {Object} payload - The JWT payload
 * @returns {string} - The JWT token
 */
const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });
    return token;
  } catch (error) {
    throw new Error(`Error generating token: ${error.message}`);
  }
};

/**
 * Verify a JWT token
 * @param {string} token - The JWT token
 * @returns {Object} - The decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error(`Error verifying token: ${error.message}`);
  }
};

/**
 * Decode a JWT token without verification
 * @param {string} token - The JWT token
 * @returns {Object} - The decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error(`Error decoding token: ${error.message}`);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
