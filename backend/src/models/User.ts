import { z } from 'zod';
import { Phase, UserRole } from './types';

// Zod schema for validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  admission_number: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  name: z.string().min(1).max(255),
  branch: z.string().min(1).max(100),
  batch: z.number().int().min(2020).max(2100),
  hostel_block: z.string().max(50).optional().nullable(),
  room_number: z.string().max(20).optional().nullable(),
  current_phase: z.enum(['documents', 'fees', 'hostel', 'academics']),
  overall_progress: z.number().min(0).max(100),
  enrollment_date: z.date(),
  role: z.enum(['student', 'admin', 'mentor']).default('student'),
  created_at: z.date(),
  updated_at: z.date()
});

export const CreateUserSchema = UserSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  overall_progress: true,
  current_phase: true
}).partial({
  hostel_block: true,
  room_number: true,
  role: true
});

export const UpdateUserSchema = UserSchema.partial().omit({
  id: true,
  admission_number: true,
  created_at: true
});

// TypeScript interfaces
export interface User {
  id: string;
  admission_number: string;
  email: string;
  phone: string;
  name: string;
  branch: string;
  batch: number;
  hostel_block?: string | null;
  room_number?: string | null;
  current_phase: Phase;
  overall_progress: number;
  enrollment_date: Date;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  admission_number: string;
  email: string;
  phone: string;
  name: string;
  branch: string;
  batch: number;
  hostel_block?: string;
  room_number?: string;
  enrollment_date: Date;
  role?: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  phone?: string;
  name?: string;
  branch?: string;
  batch?: number;
  hostel_block?: string;
  room_number?: string;
  current_phase?: Phase;
  overall_progress?: number;
  role?: UserRole;
}

export interface UserProfile extends User {
  pending_tasks_count?: number;
  completed_tasks_count?: number;
  next_deadline?: Date;
}
