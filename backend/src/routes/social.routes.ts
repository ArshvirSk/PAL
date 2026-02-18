import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import SocialService from '../services/SocialService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/social/categories
 * Get interest categories and tags
 */
router.get('/categories', authenticate, async (req: Request, res: Response) => {
  try {
    const categories = await SocialService.getInterestCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error: any) {
    logger.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get categories'
    });
  }
});

/**
 * POST /api/v1/social/interests
 * Submit user interests
 */
router.post('/interests', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { interests } = req.body;

    if (!interests || !Array.isArray(interests)) {
      return res.status(400).json({
        success: false,
        error: 'Interests array is required'
      });
    }

    await SocialService.submitInterests(userId, interests);

    res.json({
      success: true,
      message: 'Interests submitted successfully'
    });
  } catch (error: any) {
    logger.error('Error submitting interests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit interests'
    });
  }
});

/**
 * GET /api/v1/social/matches
 * Get match suggestions
 */
router.get('/matches', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : 10;

    const matches = await SocialService.getMatchSuggestions(userId, limit);

    res.json({
      success: true,
      data: matches
    });
  } catch (error: any) {
    logger.error('Error getting matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get matches'
    });
  }
});

/**
 * POST /api/v1/social/matches/:id/respond
 * Respond to a match
 */
router.post('/matches/:id/respond', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!['accepted', 'declined', 'maybe_later'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response. Must be: accepted, declined, or maybe_later'
      });
    }

    await SocialService.respondToMatch(id, response);

    res.json({
      success: true,
      message: `Match ${response}`
    });
  } catch (error: any) {
    logger.error('Error responding to match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to match'
    });
  }
});

/**
 * GET /api/v1/social/connections
 * Get user connections
 */
router.get('/connections', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const connections = await SocialService.getUserConnections(userId);

    res.json({
      success: true,
      data: connections
    });
  } catch (error: any) {
    logger.error('Error getting connections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connections'
    });
  }
});

/**
 * POST /api/v1/social/find-matches
 * Trigger match finding
 */
router.post('/find-matches', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const matches = await SocialService.findMatches(userId);

    res.json({
      success: true,
      data: matches,
      message: `Found ${matches.length} potential matches`
    });
  } catch (error: any) {
    logger.error('Error finding matches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find matches'
    });
  }
});

export default router;
