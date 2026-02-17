import { supabaseAdmin } from '../config/database';
import { User, CreateUserInput, UpdateUserInput, UserProfile } from '../models/User';
import { logger } from '../utils/logger';

export class UserRepository {
  private tableName = 'users';

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      return null;
    }
  }

  async findByAdmissionNumber(admissionNumber: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('admission_number', admissionNumber)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      logger.error('Error finding user by admission number:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return data as User;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      return null;
    }
  }

  async create(input: CreateUserInput): Promise<User> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert({
          ...input,
          current_phase: 'documents',
          overall_progress: 0,
          role: input.role || 'student'
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`User created: ${data.id}`);
      return data as User;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      logger.info(`User updated: ${id}`);
      return data as User;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      logger.info(`User deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      return false;
    }
  }

  async findAll(filters?: {
    phase?: string;
    branch?: string;
    batch?: number;
    role?: string;
  }): Promise<User[]> {
    try {
      let query = supabaseAdmin.from(this.tableName).select('*');

      if (filters?.phase) query = query.eq('current_phase', filters.phase);
      if (filters?.branch) query = query.eq('branch', filters.branch);
      if (filters?.batch) query = query.eq('batch', filters.batch);
      if (filters?.role) query = query.eq('role', filters.role);

      const { data, error } = await query;

      if (error) throw error;
      return data as User[];
    } catch (error) {
      logger.error('Error finding all users:', error);
      return [];
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user data
      const user = await this.findById(userId);
      if (!user) return null;

      // Get task counts
      const { data: taskCounts } = await supabaseAdmin
        .from('user_tasks')
        .select('status')
        .eq('user_id', userId);

      const pending = taskCounts?.filter(t => 
        t.status === 'not_started' || t.status === 'in_progress'
      ).length || 0;
      
      const completed = taskCounts?.filter(t => 
        t.status === 'completed'
      ).length || 0;

      // Get next deadline
      const { data: nextTask } = await supabaseAdmin
        .from('user_tasks')
        .select('deadline')
        .eq('user_id', userId)
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true })
        .limit(1)
        .single();

      return {
        ...user,
        pending_tasks_count: pending,
        completed_tasks_count: completed,
        next_deadline: nextTask?.deadline ? new Date(nextTask.deadline) : undefined
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateProgress(userId: string, progress: number): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({ overall_progress: progress })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating user progress:', error);
      return false;
    }
  }

  async advancePhase(userId: string, newPhase: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .update({ current_phase: newPhase })
        .eq('id', userId);

      if (error) throw error;
      logger.info(`User ${userId} advanced to phase: ${newPhase}`);
      return true;
    } catch (error) {
      logger.error('Error advancing user phase:', error);
      return false;
    }
  }
}

export default new UserRepository();
