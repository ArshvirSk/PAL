import { supabaseAdmin } from '../config/database';
import { 
  TaskDefinition, 
  UserTask, 
  UserTaskWithDefinition,
  CreateUserTaskInput,
  UpdateUserTaskInput 
} from '../models/Task';
import { Phase, TaskStatus } from '../models/types';
import { logger } from '../utils/logger';

export class TaskRepository {
  private definitionsTable = 'task_definitions';
  private userTasksTable = 'user_tasks';

  // Task Definitions
  async findDefinitionById(id: string): Promise<TaskDefinition | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.definitionsTable)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TaskDefinition;
    } catch (error) {
      logger.error('Error finding task definition:', error);
      return null;
    }
  }

  async findDefinitionsByPhase(phase: Phase): Promise<TaskDefinition[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.definitionsTable)
        .select('*')
        .eq('phase', phase)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as TaskDefinition[];
    } catch (error) {
      logger.error('Error finding task definitions by phase:', error);
      return [];
    }
  }

  async findAllDefinitions(): Promise<TaskDefinition[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.definitionsTable)
        .select('*')
        .order('phase', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as TaskDefinition[];
    } catch (error) {
      logger.error('Error finding all task definitions:', error);
      return [];
    }
  }

  // User Tasks
  async findUserTaskById(id: string): Promise<UserTask | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.userTasksTable)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as UserTask;
    } catch (error) {
      logger.error('Error finding user task:', error);
      return null;
    }
  }

  async findUserTasks(userId: string): Promise<UserTaskWithDefinition[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.userTasksTable)
        .select(`
          *,
          task_definition:task_definition_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as UserTaskWithDefinition[];
    } catch (error) {
      logger.error('Error finding user tasks:', error);
      return [];
    }
  }

  async findUserTasksByPhase(userId: string, phase: Phase): Promise<UserTaskWithDefinition[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.userTasksTable)
        .select(`
          *,
          task_definition:task_definition_id (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Filter by phase
      const filtered = (data as UserTaskWithDefinition[]).filter(
        task => task.task_definition.phase === phase
      );

      return filtered;
    } catch (error) {
      logger.error('Error finding user tasks by phase:', error);
      return [];
    }
  }

  async createUserTask(input: CreateUserTaskInput): Promise<UserTask> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.userTasksTable)
        .insert({
          ...input,
          status: input.status || 'not_started',
          attempts: 0
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`User task created: ${data.id}`);
      return data as UserTask;
    } catch (error) {
      logger.error('Error creating user task:', error);
      throw error;
    }
  }

  async updateUserTask(id: string, input: UpdateUserTaskInput): Promise<UserTask> {
    try {
      const updateData: any = { ...input };
      
      // Auto-set timestamps based on status
      if (input.status === 'in_progress' && !input.started_at) {
        updateData.started_at = new Date();
      }
      if (input.status === 'completed' && !input.completed_at) {
        updateData.completed_at = new Date();
      }
      
      updateData.last_activity_at = new Date();

      const { data, error } = await supabaseAdmin
        .from(this.userTasksTable)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      logger.info(`User task updated: ${id}`);
      return data as UserTask;
    } catch (error) {
      logger.error('Error updating user task:', error);
      throw error;
    }
  }

  async deleteUserTask(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(this.userTasksTable)
        .delete()
        .eq('id', id);

      if (error) throw error;
      logger.info(`User task deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user task:', error);
      return false;
    }
  }

  async assignTasksToUser(userId: string, phase?: Phase): Promise<UserTask[]> {
    try {
      // Get task definitions for the phase
      const definitions = phase 
        ? await this.findDefinitionsByPhase(phase)
        : await this.findAllDefinitions();

      // Create user tasks
      const tasks: UserTask[] = [];
      for (const def of definitions) {
        const task = await this.createUserTask({
          user_id: userId,
          task_definition_id: def.id,
          status: 'not_started'
        });
        tasks.push(task);
      }

      logger.info(`Assigned ${tasks.length} tasks to user ${userId}`);
      return tasks;
    } catch (error) {
      logger.error('Error assigning tasks to user:', error);
      return [];
    }
  }

  async getTaskProgress(userId: string): Promise<{
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
    overdue: number;
    percentage: number;
  }> {
    try {
      const tasks = await this.findUserTasks(userId);
      
      const completed = tasks.filter(t => t.status === 'completed').length;
      const in_progress = tasks.filter(t => t.status === 'in_progress').length;
      const not_started = tasks.filter(t => t.status === 'not_started').length;
      const overdue = tasks.filter(t => t.status === 'overdue').length;
      const total = tasks.length;
      
      const percentage = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        completed,
        in_progress,
        not_started,
        overdue,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting task progress:', error);
      return {
        total: 0,
        completed: 0,
        in_progress: 0,
        not_started: 0,
        overdue: 0,
        percentage: 0
      };
    }
  }

  async checkDependencies(taskId: string, userId: string): Promise<boolean> {
    try {
      const task = await this.findUserTaskById(taskId);
      if (!task) return false;

      const definition = await this.findDefinitionById(task.task_definition_id);
      if (!definition || !definition.dependencies || definition.dependencies.length === 0) {
        return true; // No dependencies
      }

      // Check if all dependency tasks are completed
      const userTasks = await this.findUserTasks(userId);
      const dependencyTasks = userTasks.filter(t => 
        definition.dependencies.includes(t.task_definition_id)
      );

      return dependencyTasks.every(t => t.status === 'completed');
    } catch (error) {
      logger.error('Error checking task dependencies:', error);
      return false;
    }
  }
}

export default new TaskRepository();
