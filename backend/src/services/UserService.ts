import UserRepository from '../repositories/UserRepository';
import TaskRepository from '../repositories/TaskRepository';
import { User, UpdateUserInput, UserProfile } from '../models/User';
import { Phase } from '../models/types';
import { logger } from '../utils/logger';

export interface PhaseInfo {
  phase: Phase;
  tasks: any[];
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  nextPhaseUnlocksAt?: Date;
}

export interface PhaseTransitionResult {
  success: boolean;
  newPhase: Phase;
  unlockedTasks: any[];
  celebrationMessage: string;
}

export class UserService {
  /**
   * Get user profile with progress information
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      return await UserRepository.getUserProfile(userId);
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateUserInput): Promise<User> {
    try {
      return await UserRepository.update(userId, updates);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Get current phase information with tasks
   */
  async getCurrentPhase(userId: string): Promise<PhaseInfo | null> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) return null;

      const currentPhase = user.current_phase;
      const tasks = await TaskRepository.findUserTasksByPhase(userId, currentPhase);

      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTasks = tasks.length;
      const completionPercentage = totalTasks > 0 
        ? (completedTasks / totalTasks) * 100 
        : 0;

      return {
        phase: currentPhase,
        tasks,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        totalTasks,
        completedTasks
      };
    } catch (error) {
      logger.error('Error getting current phase:', error);
      throw error;
    }
  }

  /**
   * Calculate overall progress across all phases
   */
  async calculateProgress(userId: string): Promise<number> {
    try {
      const progress = await TaskRepository.getTaskProgress(userId);
      
      // Get all user tasks with definitions
      const tasks = await TaskRepository.findUserTasks(userId);
      
      // Calculate weighted progress
      let totalWeight = 0;
      let completedWeight = 0;

      for (const task of tasks) {
        const weight = task.task_definition.is_critical 
          ? task.task_definition.weight * 2 
          : task.task_definition.weight;
        
        totalWeight += weight;
        
        if (task.status === 'completed') {
          completedWeight += weight;
        }
      }

      const weightedProgress = totalWeight > 0 
        ? (completedWeight / totalWeight) * 100 
        : 0;

      // Update user's overall progress
      await UserRepository.updateProgress(userId, weightedProgress);

      return Math.round(weightedProgress * 100) / 100;
    } catch (error) {
      logger.error('Error calculating progress:', error);
      throw error;
    }
  }

  /**
   * Check if user can advance to next phase
   */
  async canAdvancePhase(userId: string): Promise<boolean> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) return false;

      // Get all critical tasks for current phase
      const tasks = await TaskRepository.findUserTasksByPhase(userId, user.current_phase);
      const criticalTasks = tasks.filter(t => t.task_definition.is_critical);

      // Check if all critical tasks are completed
      return criticalTasks.every(t => t.status === 'completed');
    } catch (error) {
      logger.error('Error checking phase advancement:', error);
      return false;
    }
  }

  /**
   * Advance user to next phase
   */
  async advancePhase(userId: string): Promise<PhaseTransitionResult | null> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) return null;

      // Check if can advance
      const canAdvance = await this.canAdvancePhase(userId);
      if (!canAdvance) {
        return null;
      }

      // Determine next phase
      const phaseOrder: Phase[] = ['documents', 'fees', 'hostel', 'academics'];
      const currentIndex = phaseOrder.indexOf(user.current_phase);
      
      if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
        // Already at last phase
        return null;
      }

      const newPhase = phaseOrder[currentIndex + 1];

      // Update user phase
      await UserRepository.advancePhase(userId, newPhase);

      // Assign tasks for new phase
      const newTasks = await TaskRepository.assignTasksToUser(userId, newPhase);

      // Generate celebration message
      const celebrationMessages: Record<Phase, string> = {
        documents: '',
        fees: '🎉 Great job! You\'ve completed document verification. Time to handle fees!',
        hostel: '💰 Fees done! Now let\'s get you settled in your hostel.',
        academics: '🏠 Hostel sorted! Final step - let\'s set up your academics!'
      };

      logger.info(`User ${userId} advanced to phase: ${newPhase}`);

      return {
        success: true,
        newPhase,
        unlockedTasks: newTasks,
        celebrationMessage: celebrationMessages[newPhase]
      };
    } catch (error) {
      logger.error('Error advancing phase:', error);
      throw error;
    }
  }

  /**
   * Update task progress and recalculate overall progress
   */
  async updateTaskProgress(userId: string, taskId: string, status: string): Promise<void> {
    try {
      // Update task status
      await TaskRepository.updateUserTask(taskId, { 
        status: status as any,
        last_activity_at: new Date()
      });

      // Recalculate overall progress
      await this.calculateProgress(userId);

      // Check if user can advance to next phase
      if (status === 'completed') {
        const canAdvance = await this.canAdvancePhase(userId);
        if (canAdvance) {
          // Auto-advance to next phase
          await this.advancePhase(userId);
        }
      }

      logger.info(`Task ${taskId} updated to ${status} for user ${userId}`);
    } catch (error) {
      logger.error('Error updating task progress:', error);
      throw error;
    }
  }

  /**
   * Get user dashboard data
   */
  async getDashboardData(userId: string): Promise<any> {
    try {
      const profile = await this.getProfile(userId);
      const phaseInfo = await this.getCurrentPhase(userId);
      const progress = await TaskRepository.getTaskProgress(userId);

      return {
        user: profile,
        currentPhase: phaseInfo,
        overallProgress: progress,
        canAdvancePhase: await this.canAdvancePhase(userId)
      };
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Initialize new user with tasks
   */
  async initializeUser(userId: string): Promise<void> {
    try {
      // Assign all tasks for documents phase (initial phase)
      await TaskRepository.assignTasksToUser(userId, 'documents');
      
      logger.info(`User ${userId} initialized with tasks`);
    } catch (error) {
      logger.error('Error initializing user:', error);
      throw error;
    }
  }
}

export default new UserService();
