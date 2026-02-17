import TaskRepository from '../repositories/TaskRepository';
import UserRepository from '../repositories/UserRepository';
import { 
  TaskDefinition, 
  UserTask, 
  UserTaskWithDefinition,
  CreateUserTaskInput,
  UpdateUserTaskInput 
} from '../models/Task';
import { Phase, TaskStatus } from '../models/types';
import { logger } from '../utils/logger';

export class TaskService {
  /**
   * Get all task definitions
   */
  async getAllDefinitions(): Promise<TaskDefinition[]> {
    try {
      return await TaskRepository.findAllDefinitions();
    } catch (error) {
      logger.error('Error getting all task definitions:', error);
      throw error;
    }
  }

  /**
   * Get task definitions by phase
   */
  async getDefinitionsByPhase(phase: Phase): Promise<TaskDefinition[]> {
    try {
      return await TaskRepository.findDefinitionsByPhase(phase);
    } catch (error) {
      logger.error('Error getting task definitions by phase:', error);
      throw error;
    }
  }

  /**
   * Get user's tasks
   */
  async getUserTasks(userId: string): Promise<UserTaskWithDefinition[]> {
    try {
      return await TaskRepository.findUserTasks(userId);
    } catch (error) {
      logger.error('Error getting user tasks:', error);
      throw error;
    }
  }

  /**
   * Get user's tasks for specific phase
   */
  async getUserTasksByPhase(userId: string, phase: Phase): Promise<UserTaskWithDefinition[]> {
    try {
      return await TaskRepository.findUserTasksByPhase(userId, phase);
    } catch (error) {
      logger.error('Error getting user tasks by phase:', error);
      throw error;
    }
  }

  /**
   * Get single user task by ID
   */
  async getUserTask(taskId: string): Promise<UserTask | null> {
    try {
      return await TaskRepository.findUserTaskById(taskId);
    } catch (error) {
      logger.error('Error getting user task:', error);
      throw error;
    }
  }

  /**
   * Update user task status
   */
  async updateTaskStatus(
    userId: string, 
    taskId: string, 
    status: TaskStatus
  ): Promise<UserTask> {
    try {
      // Check if task belongs to user
      const task = await TaskRepository.findUserTaskById(taskId);
      if (!task || task.user_id !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      // Check dependencies before allowing status change
      if (status === 'in_progress' || status === 'completed') {
        const dependenciesMet = await TaskRepository.checkDependencies(taskId, userId);
        if (!dependenciesMet) {
          throw new Error('Cannot start task: dependencies not completed');
        }
      }

      // Update task
      const updates: UpdateUserTaskInput = {
        status,
        last_activity_at: new Date()
      };

      if (status === 'in_progress' && !task.started_at) {
        updates.started_at = new Date();
      }

      if (status === 'completed' && !task.completed_at) {
        updates.completed_at = new Date();
      }

      const updatedTask = await TaskRepository.updateUserTask(taskId, updates);

      logger.info(`Task ${taskId} updated to ${status} for user ${userId}`);

      return updatedTask;
    } catch (error) {
      logger.error('Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Get task progress for user
   */
  async getTaskProgress(userId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
    overdue: number;
    percentage: number;
    byPhase: Record<Phase, {
      total: number;
      completed: number;
      percentage: number;
    }>;
  }> {
    try {
      const progress = await TaskRepository.getTaskProgress(userId);
      const allTasks = await TaskRepository.findUserTasks(userId);

      // Calculate progress by phase
      const phases: Phase[] = ['documents', 'fees', 'hostel', 'academics'];
      const byPhase: any = {};

      for (const phase of phases) {
        const phaseTasks = allTasks.filter(t => t.task_definition.phase === phase);
        const completed = phaseTasks.filter(t => t.status === 'completed').length;
        const total = phaseTasks.length;

        byPhase[phase] = {
          total,
          completed,
          percentage: total > 0 ? (completed / total) * 100 : 0
        };
      }

      return {
        ...progress,
        byPhase
      };
    } catch (error) {
      logger.error('Error getting task progress:', error);
      throw error;
    }
  }

  /**
   * Check if task dependencies are met
   */
  async checkDependencies(taskId: string, userId: string): Promise<{
    met: boolean;
    missingDependencies: TaskDefinition[];
  }> {
    try {
      const task = await TaskRepository.findUserTaskById(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const definition = await TaskRepository.findDefinitionById(task.task_definition_id);
      if (!definition || !definition.dependencies || definition.dependencies.length === 0) {
        return { met: true, missingDependencies: [] };
      }

      // Get all user tasks
      const userTasks = await TaskRepository.findUserTasks(userId);
      
      // Find dependency tasks
      const dependencyTasks = userTasks.filter(t => 
        definition.dependencies.includes(t.task_definition_id)
      );

      // Check which dependencies are not completed
      const missingDeps: TaskDefinition[] = [];
      for (const depTask of dependencyTasks) {
        if (depTask.status !== 'completed') {
          missingDeps.push(depTask.task_definition);
        }
      }

      return {
        met: missingDeps.length === 0,
        missingDependencies: missingDeps
      };
    } catch (error) {
      logger.error('Error checking dependencies:', error);
      throw error;
    }
  }

  /**
   * Get available tasks (dependencies met, not started)
   */
  async getAvailableTasks(userId: string): Promise<UserTaskWithDefinition[]> {
    try {
      const allTasks = await TaskRepository.findUserTasks(userId);
      const availableTasks: UserTaskWithDefinition[] = [];

      for (const task of allTasks) {
        if (task.status === 'not_started') {
          const depsCheck = await this.checkDependencies(task.id, userId);
          if (depsCheck.met) {
            availableTasks.push(task);
          }
        }
      }

      return availableTasks;
    } catch (error) {
      logger.error('Error getting available tasks:', error);
      throw error;
    }
  }

  /**
   * Get next recommended task
   */
  async getNextTask(userId: string): Promise<UserTaskWithDefinition | null> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) return null;

      // Get available tasks for current phase
      const phaseTasks = await TaskRepository.findUserTasksByPhase(userId, user.current_phase);
      
      // Filter to not started tasks with dependencies met
      for (const task of phaseTasks) {
        if (task.status === 'not_started') {
          const depsCheck = await this.checkDependencies(task.id, userId);
          if (depsCheck.met) {
            return task;
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error getting next task:', error);
      throw error;
    }
  }

  /**
   * Check if task is applicable for user
   */
  async isTaskApplicable(userId: string, taskDefinitionId: string): Promise<boolean> {
    try {
      const user = await UserRepository.findById(userId);
      const definition = await TaskRepository.findDefinitionById(taskDefinitionId);

      if (!user || !definition) return false;

      // Check applicable_for conditions
      if (!definition.applicable_for) return true;

      const conditions = definition.applicable_for;

      // Check branch condition
      if (conditions.branches && conditions.branches.length > 0) {
        if (!conditions.branches.includes(user.branch)) {
          return false;
        }
      }

      // Check hostel resident condition
      if (conditions.hostelResident !== undefined) {
        const isHostelResident = !!user.hostel_block;
        if (conditions.hostelResident !== isHostelResident) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error checking task applicability:', error);
      return false;
    }
  }

  /**
   * Assign tasks to user based on conditions
   */
  async assignConditionalTasks(userId: string, phase: Phase): Promise<UserTask[]> {
    try {
      const definitions = await TaskRepository.findDefinitionsByPhase(phase);
      const assignedTasks: UserTask[] = [];

      for (const def of definitions) {
        const isApplicable = await this.isTaskApplicable(userId, def.id);
        if (isApplicable) {
          const task = await TaskRepository.createUserTask({
            user_id: userId,
            task_definition_id: def.id,
            status: 'not_started'
          });
          assignedTasks.push(task);
        }
      }

      logger.info(`Assigned ${assignedTasks.length} conditional tasks to user ${userId} for phase ${phase}`);
      return assignedTasks;
    } catch (error) {
      logger.error('Error assigning conditional tasks:', error);
      throw error;
    }
  }

  /**
   * Update task deadline
   */
  async updateDeadline(taskId: string, userId: string, deadline: Date): Promise<UserTask> {
    try {
      const task = await TaskRepository.findUserTaskById(taskId);
      if (!task || task.user_id !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      return await TaskRepository.updateUserTask(taskId, { deadline });
    } catch (error) {
      logger.error('Error updating task deadline:', error);
      throw error;
    }
  }

  /**
   * Add notes to task
   */
  async addTaskNotes(taskId: string, userId: string, notes: string): Promise<UserTask> {
    try {
      const task = await TaskRepository.findUserTaskById(taskId);
      if (!task || task.user_id !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      return await TaskRepository.updateUserTask(taskId, { notes });
    } catch (error) {
      logger.error('Error adding task notes:', error);
      throw error;
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<UserTaskWithDefinition[]> {
    try {
      const allTasks = await TaskRepository.findUserTasks(userId);
      const now = new Date();

      return allTasks.filter(task => 
        task.deadline && 
        new Date(task.deadline) < now && 
        task.status !== 'completed'
      );
    } catch (error) {
      logger.error('Error getting overdue tasks:', error);
      throw error;
    }
  }
}

export default new TaskService();
