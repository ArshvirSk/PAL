import { z } from 'zod';
import { Phase, TaskStatus, DocumentType } from './types';

// Task Definition Schema
export const TaskDefinitionSchema = z.object({
  id: z.string().uuid(),
  phase: z.enum(['documents', 'fees', 'hostel', 'academics']),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  order_index: z.number().int().min(0),
  is_critical: z.boolean().default(false),
  weight: z.number().min(0).max(10).default(1.0),
  dependencies: z.array(z.string().uuid()).default([]),
  required_documents: z.array(z.string()).default([]),
  estimated_duration: z.number().int().min(0).optional().nullable(),
  instructions: z.string().optional().nullable(),
  help_resources: z.array(z.any()).optional().nullable(),
  applicable_for: z.record(z.any()).optional().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// User Task Schema
export const UserTaskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  task_definition_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'overdue']),
  started_at: z.date().optional().nullable(),
  completed_at: z.date().optional().nullable(),
  deadline: z.date().optional().nullable(),
  attempts: z.number().int().min(0).default(0),
  last_activity_at: z.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// TypeScript interfaces
export interface TaskDefinition {
  id: string;
  phase: Phase;
  title: string;
  description?: string | null;
  order_index: number;
  is_critical: boolean;
  weight: number;
  dependencies: string[];
  required_documents: DocumentType[];
  estimated_duration?: number | null;
  instructions?: string | null;
  help_resources?: HelpResource[] | null;
  applicable_for?: ApplicableConditions | null;
  created_at: Date;
  updated_at: Date;
}

export interface HelpResource {
  type: 'video' | 'link' | 'guide' | 'map';
  url: string;
  title?: string;
}

export interface ApplicableConditions {
  branches?: string[];
  hostelResident?: boolean;
  customCondition?: string;
}

export interface UserTask {
  id: string;
  user_id: string;
  task_definition_id: string;
  status: TaskStatus;
  started_at?: Date | null;
  completed_at?: Date | null;
  deadline?: Date | null;
  attempts: number;
  last_activity_at?: Date | null;
  notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserTaskWithDefinition extends UserTask {
  task_definition: TaskDefinition;
}

export interface CreateUserTaskInput {
  user_id: string;
  task_definition_id: string;
  status?: TaskStatus;
  deadline?: Date;
}

export interface UpdateUserTaskInput {
  status?: TaskStatus;
  started_at?: Date;
  completed_at?: Date;
  deadline?: Date;
  attempts?: number;
  last_activity_at?: Date;
  notes?: string;
}
