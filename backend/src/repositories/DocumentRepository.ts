import { supabaseAdmin } from '../config/database';
import { Document, CreateDocumentInput, UpdateDocumentInput } from '../models/Document';
import { DocumentType, TrafficLightStatus } from '../models/types';
import { logger } from '../utils/logger';

export class DocumentRepository {
  private tableName = 'documents';

  async findById(id: string): Promise<Document | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Document;
    } catch (error) {
      logger.error('Error finding document by ID:', error);
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Document[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    } catch (error) {
      logger.error('Error finding documents by user ID:', error);
      return [];
    }
  }

  async findByUserAndType(userId: string, documentType: DocumentType): Promise<Document[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    } catch (error) {
      logger.error('Error finding document by user and type:', error);
      return [];
    }
  }

  async create(input: CreateDocumentInput): Promise<Document> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert({
          ...input,
          status: input.status || 'processing',
          uploaded_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      logger.info(`Document created: ${data.id}`);
      return data as Document;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw error;
    }
  }

  async update(id: string, input: UpdateDocumentInput): Promise<Document> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      logger.info(`Document updated: ${id}`);
      return data as Document;
    } catch (error) {
      logger.error('Error updating document:', error);
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
      logger.info(`Document deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting document:', error);
      return false;
    }
  }

  async findByStatus(status: TrafficLightStatus | 'processing', limit?: number): Promise<Document[]> {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('uploaded_at', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Document[];
    } catch (error) {
      logger.error('Error finding documents by status:', error);
      return [];
    }
  }

  async getVerificationQueue(filters?: {
    status?: string[];
    documentType?: string[];
    branch?: string[];
  }): Promise<any[]> {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          users:user_id (
            name,
            admission_number,
            branch
          )
        `);

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.documentType && filters.documentType.length > 0) {
        query = query.in('document_type', filters.documentType);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: true });

      if (error) throw error;

      // Filter by branch if needed
      let results = data || [];
      if (filters?.branch && filters.branch.length > 0) {
        results = results.filter((doc: any) => 
          filters.branch?.includes(doc.users?.branch)
        );
      }

      return results;
    } catch (error) {
      logger.error('Error getting verification queue:', error);
      return [];
    }
  }

  async countByStatus(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('status');

      if (error) throw error;

      const counts: Record<string, number> = {
        green: 0,
        yellow: 0,
        red: 0,
        processing: 0
      };

      data?.forEach((doc: any) => {
        if (counts[doc.status] !== undefined) {
          counts[doc.status]++;
        }
      });

      return counts;
    } catch (error) {
      logger.error('Error counting documents by status:', error);
      return { green: 0, yellow: 0, red: 0, processing: 0 };
    }
  }
}

export default new DocumentRepository();
