import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import UserService from '../services/UserService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/users/profile
 * Get current user's profile
 */
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const profile = await UserService.getProfile(req.user.userId);

    if (!profile) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ profile });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/v1/users/profile
 * Update current user's profile
 */
router.put(
  '/profile',
  [
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const updates = req.body;
      const updatedUser = await UserService.updateProfile(req.user.userId, updates);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * GET /api/v1/users/progress
 * Get user's onboarding progress
 */
router.get('/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const progress = await UserService.calculateProgress(req.user.userId);

    res.json({ progress });
  } catch (error) {
    logger.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/v1/users/current-phase
 * Get current phase information with tasks
 */
router.get('/current-phase', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const phaseInfo = await UserService.getCurrentPhase(req.user.userId);

    if (!phaseInfo) {
      res.status(404).json({ error: 'Phase information not found' });
      return;
    }

    res.json({ phaseInfo });
  } catch (error) {
    logger.error('Get current phase error:', error);
    res.status(500).json({ error: 'Failed to get current phase' });
  }
});

/**
 * POST /api/v1/users/advance-phase
 * Advance to next phase (if eligible)
 */
router.post('/advance-phase', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await UserService.advancePhase(req.user.userId);

    if (!result) {
      res.status(400).json({ 
        error: 'Cannot advance phase',
        message: 'Please complete all critical tasks in the current phase first'
      });
      return;
    }

    res.json({
      message: result.celebrationMessage,
      newPhase: result.newPhase,
      unlockedTasks: result.unlockedTasks
    });
  } catch (error) {
    logger.error('Advance phase error:', error);
    res.status(500).json({ error: 'Failed to advance phase' });
  }
});

/**
 * GET /api/v1/users/dashboard
 * Get complete dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const dashboardData = await UserService.getDashboardData(req.user.userId);

    res.json(dashboardData);
  } catch (error) {
    logger.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * POST /api/v1/users/initialize
 * Initialize new user with tasks (called after registration)
 */
router.post('/initialize', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await UserService.initializeUser(req.user.userId);

    res.json({
      message: 'User initialized successfully'
    });
  } catch (error) {
    logger.error('Initialize user error:', error);
    res.status(500).json({ error: 'Failed to initialize user' });
  }
});

export default router;
