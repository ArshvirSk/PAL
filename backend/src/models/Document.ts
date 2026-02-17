import { z } from 'zod';
import { DocumentType, TrafficLightStatus } from './types';

// Zod schemas
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  document_type: z.enum([
    'marksheet_10th',
    'marksheet_12th',
    'id_proof',
    'photo',
    'fee_receipt',
    'medical_certificate'
  ]),
  status: z.enum(['green', 'yellow', 'red', 'processing']),
  original_file_url: z.string().url(),
  processed_file_url: z.string().url().optional().nullable(),
  uploaded_at: z.date(),
  verified_at: z.date().optional().nullable(),
  verified_by: z.string().uuid().optional().nullable(),
  extracted_data: z.record(z.any()).optional().nullable(),
  validation_results: z.array(z.any()).optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  review_notes: z.string().optional().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

export const CreateDocumentSchema = DocumentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  uploaded_at: true
}).partial({
  status: true,
  processed_file_url: true,
  verified_at: true,
  verified_by: true,
  extracted_data: true,
  validation_results: true,
  confidence: true,
  review_notes: true
});

// TypeScript interfaces
export interface Document {
  id: string;
  user_id: string;
  document_type: DocumentType;
  status: TrafficLightStatus | 'processing';
  original_file_url: string;
  processed_file_url?: string | null;
  uploaded_at: Date;
  verified_at?: Date | null;
  verified_by?: string | null;
  extracted_data?: ExtractedData | null;
  validation_results?: ValidationResult[] | null;
  confidence?: number | null;
  review_notes?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ExtractedData {
  fields: Record<string, any>;
  rawText: string;
  metadata: {
    pageCount?: number;
    fileSize: number;
    dimensions?: { width: number; height: number };
  };
}

export interface ValidationResult {
  field: string;
  expected: string;
  extracted: string;
  match: boolean;
  confidence: number;
  issue?: string;
}

export interface CreateDocumentInput {
  user_id: string;
  document_type: DocumentType;
  original_file_url: string;
  status?: TrafficLightStatus | 'processing';
}

export interface UpdateDocumentInput {
  status?: TrafficLightStatus | 'processing';
  processed_file_url?: string;
  verified_at?: Date;
  verified_by?: string;
  extracted_data?: ExtractedData;
  validation_results?: ValidationResult[];
  confidence?: number;
  review_notes?: string;
}
