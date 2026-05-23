const userRepository = require('../repositories/user.repository');
const User = require('../entities/user.entity');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken, verifyToken } = require('../utils/jwt');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<Object>} - { user, token }
   */
  async register(userData) {
    try {
      const { name, email, password } = userData;

      // Validate input
      if (!name || !email || !password) {
        throw new Error('Name, email, and password are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Check if user already exists
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = new User(null, name, email, hashedPassword, 'farmer');
      const createdUser = await userRepository.create(user);

      // Generate token
      const token = generateToken({
        id: createdUser.id,
        email: createdUser.email,
        role: createdUser.role,
      });

      return {
        user: createdUser.toJSON(),
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} - { user, token }
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Compare passwords
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Auto-login user (creates user if not exists)
   * @param {Object} data - { name, email }
   * @returns {Promise<Object>} - { user, token }
   */
  async loginAuto(data) {
    try {
      const { name, email } = data;

      // Validate input
      if (!email || !name) {
        throw new Error('Name and email are required');
      }

      // Find user by email
      let user = await userRepository.findByEmail(email);

      // If user doesn't exist, create one with a temporary password
      if (!user) {
        const tempPassword = 'auto_' + Date.now();
        const hashedPassword = await hashPassword(tempPassword);
        user = new User(null, name, email, hashedPassword, 'farmer');
        user = await userRepository.create(user);
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        user: user.toJSON(),
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify a token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} - Decoded token payload
   */
  async verifyAuthToken(token) {
    try {
      return verifyToken(token);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<User>} - User object
   */
  async getUserById(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();
