import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import NotificationService from '../services/NotificationService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/notifications
 * Get user notifications
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limitParam = req.query.limit;
    const unreadOnlyParam = req.query.unreadOnly;
    
    const limit = limitParam ? parseInt(limitParam as string) : 20;
    const unreadOnly = unreadOnlyParam === 'true';

    const notifications = await NotificationService.getUserNotifications(
      userId,
      limit,
      unreadOnly
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error: any) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await NotificationService.markAsRead(id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

export default router;
