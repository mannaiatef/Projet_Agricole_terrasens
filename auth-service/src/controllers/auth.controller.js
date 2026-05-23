const authService = require('../services/auth.service');

class AuthController {
  /**
   * Register endpoint
   * POST /auth/register
   */
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      const result = await authService.register({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Login endpoint
   * POST /auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await authService.login({
        email,
        password,
      });

      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Login endpoint (auto-creates user)
   * POST /auth/login-auto
   */
  async loginAuto(req, res) {
    try {
      const { name, email } = req.body;

      const result = await authService.loginAuto({
        name,
        email,
      });

      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Verify token endpoint
   * POST /auth/verify
   */
  async verify(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token is required',
        });
      }

      const decoded = await authService.verifyAuthToken(token);

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: { user: decoded },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get user profile endpoint
   * GET /auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await authService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: { user },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new AuthController();
