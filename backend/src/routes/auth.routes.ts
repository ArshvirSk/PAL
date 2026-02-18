import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AuthService from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to user's registered mobile
 */
router.post(
  '/send-otp',
  [
    body('admissionNumber')
      .trim()
      .notEmpty()
      .withMessage('Admission number is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { admissionNumber } = req.body;

      // Send OTP
      const result = await AuthService.sendOTP(admissionNumber);

      if (!result.success) {
        res.status(404).json({ 
          error: result.message 
        });
        return;
      }

      res.json({
        message: result.message,
        expiresIn: result.expiresIn
      });
    } catch (error) {
      logger.error('Send OTP error:', error);
      res.status(500).json({ 
        error: 'Failed to send OTP. Please try again.' 
      });
    }
  }
);

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and get authentication tokens
 */
router.post(
  '/verify-otp',
  [
    body('admissionNumber')
      .trim()
      .notEmpty()
      .withMessage('Admission number is required'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { admissionNumber, otp } = req.body;

      // Verify OTP
      const result = await AuthService.verifyOTP(admissionNumber, otp);

      if (!result) {
        res.status(401).json({ 
          error: 'Invalid or expired OTP' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            admissionNumber: result.user.admission_number,
            branch: result.user.branch,
            currentPhase: result.user.current_phase,
            role: result.user.role
          }
        }
      });
    } catch (error) {
      logger.error('Verify OTP error:', error);
      res.status(500).json({ 
        error: 'Failed to verify OTP. Please try again.' 
      });
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { refreshToken } = req.body;

      // Refresh token
      const newAccessToken = await AuthService.refreshAccessToken(refreshToken);

      if (!newAccessToken) {
        res.status(401).json({ 
          error: 'Invalid or expired refresh token' 
        });
        return;
      }

      res.json({
        accessToken: newAccessToken
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(500).json({ 
        error: 'Failed to refresh token' 
      });
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout user (invalidate tokens)
 */
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Logout
      await AuthService.logout(req.user.userId);

      res.json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ 
        error: 'Failed to logout' 
      });
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get(
  '/me',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      res.json({
        user: req.user
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({ 
        error: 'Failed to get user information' 
      });
    }
  }
);

export default router;
