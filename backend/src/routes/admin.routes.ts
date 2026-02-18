import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import DocumentService from '../services/DocumentService';
import SentimentService from '../services/SentimentService';
import NotificationService from '../services/NotificationService';
import RAGService from '../services/RAGService';
import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import QueueService from '../services/QueueService';

const router = Router();

// Middleware to check admin role
const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

/**
 * GET /api/v1/admin/queue
 * Get document verification queue
 */
router.get('/queue', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const statusParam = req.query.status as string;
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : 50;

    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        user:users(id, full_name, admission_number, branch)
      `)
      .order('uploaded_at', { ascending: true })
      .limit(limit);

    if (statusParam && ['green', 'yellow', 'red'].includes(statusParam)) {
      query = query.eq('status', statusParam);
    }

    const { data: documents, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: documents || []
    });
  } catch (error: any) {
    logger.error('Error getting verification queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification queue'
    });
  }
});

/**
 * POST /api/v1/admin/documents/:id/approve
 * Approve a document
 */
router.post('/documents/:id/approve', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await DocumentService.updateDocumentStatus(id, 'green', {
      reviewNotes: notes || 'Approved by admin'
    });

    res.json({
      success: true,
      message: 'Document approved'
    });
  } catch (error: any) {
    logger.error('Error approving document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve document'
    });
  }
});

/**
 * POST /api/v1/admin/documents/:id/reject
 * Reject a document
 */
router.post('/documents/:id/reject', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    await DocumentService.updateDocumentStatus(id, 'red', {
      reviewNotes: reason
    });

    res.json({
      success: true,
      message: 'Document rejected'
    });
  } catch (error: any) {
    logger.error('Error rejecting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject document'
    });
  }
});

/**
 * GET /api/v1/admin/analytics/funnel
 * Get onboarding funnel analytics
 */
router.get('/analytics/funnel', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, current_phase, overall_progress')
      .eq('role', 'student');

    if (!users) {
      return res.json({
        success: true,
        data: {
          total: 0,
          byPhase: {},
          averageProgress: 0
        }
      });
    }

    const byPhase = users.reduce((acc: any, user) => {
      acc[user.current_phase] = (acc[user.current_phase] || 0) + 1;
      return acc;
    }, {});

    const avgProgress = users.reduce((sum, u) => sum + (u.overall_progress || 0), 0) / users.length;

    res.json({
      success: true,
      data: {
        total: users.length,
        byPhase,
        averageProgress: Math.round(avgProgress * 100) / 100,
        funnel: [
          { stage: 'Registered', count: users.length, percent: 100 },
          { stage: 'Documents', count: byPhase.documents || 0, percent: Math.round((byPhase.documents || 0) / users.length * 100) },
          { stage: 'Fees', count: byPhase.fees || 0, percent: Math.round((byPhase.fees || 0) / users.length * 100) },
          { stage: 'Hostel', count: byPhase.hostel || 0, percent: Math.round((byPhase.hostel || 0) / users.length * 100) },
          { stage: 'Academics', count: byPhase.academics || 0, percent: Math.round((byPhase.academics || 0) / users.length * 100) }
        ]
      }
    });
  } catch (error: any) {
    logger.error('Error getting funnel analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get funnel analytics'
    });
  }
});

/**
 * GET /api/v1/admin/sentiment/alerts
 * Get sentiment alerts
 */
router.get('/sentiment/alerts', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const students = await SentimentService.getStudentsNeedingIntervention();

    res.json({
      success: true,
      data: students
    });
  } catch (error: any) {
    logger.error('Error getting sentiment alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sentiment alerts'
    });
  }
});

/**
 * GET /api/v1/admin/sentiment/trends
 * Get sentiment trends
 */
router.get('/sentiment/trends', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const daysParam = req.query.days;
    const days = daysParam ? parseInt(daysParam as string) : 30;

    const trends = await SentimentService.getSentimentTrends(days);

    res.json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    logger.error('Error getting sentiment trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sentiment trends'
    });
  }
});

/**
 * POST /api/v1/admin/knowledge/upload
 * Upload document to knowledge base
 */
router.post('/knowledge/upload', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { documents } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        error: 'Documents array is required'
      });
    }

    await RAGService.addDocuments(documents);

    res.json({
      success: true,
      message: `${documents.length} documents added to knowledge base`
    });
  } catch (error: any) {
    logger.error('Error uploading to knowledge base:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload to knowledge base'
    });
  }
});

/**
 * POST /api/v1/admin/notifications/bulk
 * Send bulk notifications
 */
router.post('/notifications/bulk', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userIds, notification } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
    }

    if (!notification || !notification.title || !notification.message) {
      return res.status(400).json({
        success: false,
        error: 'Notification title and message are required'
      });
    }

    await NotificationService.sendBulkNotifications(userIds, notification);

    res.json({
      success: true,
      message: `Bulk notifications sent to ${userIds.length} users`
    });
  } catch (error: any) {
    logger.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notifications'
    });
  }
});

/**
 * GET /api/v1/admin/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await QueueService.getQueueStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue stats'
    });
  }
});

/**
 * GET /api/v1/admin/users
 * Get all users (with filters)
 */
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { branch, phase, role } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('id, full_name, admission_number, email, phone, branch, batch, current_phase, overall_progress, role')
      .order('created_at', { ascending: false });

    if (branch) query = query.eq('branch', branch);
    if (phase) query = query.eq('current_phase', phase);
    if (role) query = query.eq('role', role);

    const { data: users, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: users || []
    });
  } catch (error: any) {
    logger.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

export default router;
