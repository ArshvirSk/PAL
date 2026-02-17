import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import TaskService from '../services/TaskService';
import UserService from '../services/UserService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/tasks
 * Get all user's tasks
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const tasks = await TaskService.getUserTasks(req.user.userId);

    res.json({ tasks });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

/**
 * GET /api/v1/tasks/phase/:phase
 * Get tasks for specific phase
 */
router.get(
  '/phase/:phase',
  [
    param('phase')
      .isIn(['documents', 'fees', 'hostel', 'academics'])
      .withMessage('Invalid phase')
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

      const { phase } = req.params;
      const tasks = await TaskService.getUserTasksByPhase(req.user.userId, phase as any);

      res.json({ tasks });
    } catch (error) {
      logger.error('Get tasks by phase error:', error);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  }
);

/**
 * GET /api/v1/tasks/progress
 * Get task progress summary
 */
router.get('/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const progress = await TaskService.getTaskProgress(req.user.userId);

    res.json({ progress });
  } catch (error) {
    logger.error('Get task progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

/**
 * GET /api/v1/tasks/available
 * Get available tasks (dependencies met)
 */
router.get('/available', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const tasks = await TaskService.getAvailableTasks(req.user.userId);

    res.json({ tasks });
  } catch (error) {
    logger.error('Get available tasks error:', error);
    res.status(500).json({ error: 'Failed to get available tasks' });
  }
});

/**
 * GET /api/v1/tasks/next
 * Get next recommended task
 */
router.get('/next', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const task = await TaskService.getNextTask(req.user.userId);

    if (!task) {
      res.json({ 
        message: 'No tasks available. Great job!',
        task: null 
      });
      return;
    }

    res.json({ task });
  } catch (error) {
    logger.error('Get next task error:', error);
    res.status(500).json({ error: 'Failed to get next task' });
  }
});

/**
 * GET /api/v1/tasks/overdue
 * Get overdue tasks
 */
router.get('/overdue', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const tasks = await TaskService.getOverdueTasks(req.user.userId);

    res.json({ tasks });
  } catch (error) {
    logger.error('Get overdue tasks error:', error);
    res.status(500).json({ error: 'Failed to get overdue tasks' });
  }
});

/**
 * GET /api/v1/tasks/:taskId
 * Get single task details
 */
router.get(
  '/:taskId',
  [
    param('taskId').isUUID().withMessage('Invalid task ID')
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

      const { taskId } = req.params;
      const task = await TaskService.getUserTask(taskId);

      if (!task || task.user_id !== req.user.userId) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (error) {
      logger.error('Get task error:', error);
      res.status(500).json({ error: 'Failed to get task' });
    }
  }
);

/**
 * PATCH /api/v1/tasks/:taskId/status
 * Update task status
 */
router.patch(
  '/:taskId/status',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('status')
      .isIn(['not_started', 'in_progress', 'completed', 'overdue'])
      .withMessage('Invalid status')
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

      const { taskId } = req.params;
      const { status } = req.body;

      const updatedTask = await TaskService.updateTaskStatus(
        req.user.userId,
        taskId,
        status
      );

      // Update overall progress
      await UserService.updateTaskProgress(req.user.userId, taskId, status);

      res.json({
        message: 'Task status updated successfully',
        task: updatedTask
      });
    } catch (error: any) {
      logger.error('Update task status error:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to update task status' 
      });
    }
  }
);

/**
 * PATCH /api/v1/tasks/:taskId/deadline
 * Update task deadline
 */
router.patch(
  '/:taskId/deadline',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('deadline').isISO8601().withMessage('Invalid deadline format')
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

      const { taskId } = req.params;
      const { deadline } = req.body;

      const updatedTask = await TaskService.updateDeadline(
        taskId,
        req.user.userId,
        new Date(deadline)
      );

      res.json({
        message: 'Deadline updated successfully',
        task: updatedTask
      });
    } catch (error: any) {
      logger.error('Update deadline error:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to update deadline' 
      });
    }
  }
);

/**
 * PATCH /api/v1/tasks/:taskId/notes
 * Add/update task notes
 */
router.patch(
  '/:taskId/notes',
  [
    param('taskId').isUUID().withMessage('Invalid task ID'),
    body('notes').isString().withMessage('Notes must be a string')
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

      const { taskId } = req.params;
      const { notes } = req.body;

      const updatedTask = await TaskService.addTaskNotes(
        taskId,
        req.user.userId,
        notes
      );

      res.json({
        message: 'Notes updated successfully',
        task: updatedTask
      });
    } catch (error: any) {
      logger.error('Update notes error:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to update notes' 
      });
    }
  }
);

/**
 * GET /api/v1/tasks/:taskId/dependencies
 * Check task dependencies
 */
router.get(
  '/:taskId/dependencies',
  [
    param('taskId').isUUID().withMessage('Invalid task ID')
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

      const { taskId } = req.params;
      const depsCheck = await TaskService.checkDependencies(taskId, req.user.userId);

      res.json(depsCheck);
    } catch (error) {
      logger.error('Check dependencies error:', error);
      res.status(500).json({ error: 'Failed to check dependencies' });
    }
  }
);

export default router;
