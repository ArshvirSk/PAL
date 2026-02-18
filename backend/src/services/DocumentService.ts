import { supabaseAdmin } from '../config/database';
import DocumentRepository from '../repositories/DocumentRepository';
import { logger } from '../utils/logger';
import { Document } from '../models/Document';
import { TrafficLightStatus } from '../models/types';
import VisionService from './VisionService';
import QueueService from './QueueService';
import UserService from './UserService';

type DocumentStatus = TrafficLightStatus | 'processing';

interface UploadDocumentInput {
  userId: string;
  documentType: string;
  file: Express.Multer.File;
}

interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class DocumentService {
  /**
   * Upload a document to Supabase Storage
   */
  async uploadDocument(input: UploadDocumentInput): Promise<Document> {
    const { userId, documentType, file } = input;

    try {
      // Validate file
      const validation = this.validateFile(file, documentType);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${userId}/${documentType}/${timestamp}_${file.originalname}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (uploadError) {
        logger.error('Supabase storage upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Create document record
      const document = await DocumentRepository.create({
        user_id: userId,
        document_type: documentType as any,
        original_file_url: urlData.publicUrl,
        status: 'processing'
      });

      logger.info(`Document uploaded: ${document.id}`);

      // Add to processing queue
      await QueueService.addDocumentProcessingJob({
        documentId: document.id,
        userId,
        documentType,
        fileUrl: urlData.publicUrl
      });

      return document;
    } catch (error) {
      logger.error('Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Validate uploaded file
   */
  private validateFile(file: Express.Multer.File, _documentType: string): DocumentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size (max 10MB)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760');
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    // Check mime type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    // Check file name
    if (!file.originalname || file.originalname.length > 255) {
      errors.push('Invalid file name');
    }

    // Warn if file is too small (might be corrupted)
    if (file.size < 1024) {
      warnings.push('File size is very small, might be corrupted');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<Document | null> {
    return DocumentRepository.findById(documentId);
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string): Promise<Document[]> {
    return DocumentRepository.findByUserId(userId);
  }

  /**
   * Get documents by type for a user
   */
  async getUserDocumentsByType(userId: string, documentType: string): Promise<Document[]> {
    return DocumentRepository.findByUserAndType(userId, documentType as any);
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    metadata?: {
      confidence?: number;
      extractedData?: any;
      validationResults?: any;
      reviewNotes?: string;
    }
  ): Promise<Document> {
    const updateData: any = { status };

    if (metadata?.confidence !== undefined) {
      updateData.confidence = metadata.confidence;
    }
    if (metadata?.extractedData) {
      updateData.extracted_data = metadata.extractedData;
    }
    if (metadata?.validationResults) {
      updateData.validation_results = metadata.validationResults;
    }
    if (metadata?.reviewNotes) {
      updateData.review_notes = metadata.reviewNotes;
    }

    if (status === 'green') {
      updateData.verified_at = new Date();
    }

    return DocumentRepository.update(documentId, updateData);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = await DocumentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Delete from storage
    try {
      const fileName = document.original_file_url.split('/documents/')[1];
      if (fileName) {
        await supabaseAdmin.storage.from('documents').remove([fileName]);
      }
    } catch (error) {
      logger.warn('Failed to delete file from storage:', error);
    }

    // Delete from database
    await DocumentRepository.delete(documentId);
    logger.info(`Document deleted: ${documentId}`);
  }

  /**
   * Get documents pending verification
   */
  async getPendingDocuments(limit: number = 50): Promise<Document[]> {
    return DocumentRepository.findByStatus('yellow' as any, limit);
  }

  /**
   * Process document with Vision AI
   */
  private async processDocument(
    documentId: string,
    imageBuffer: Buffer,
    mimeType: string,
    documentType: string
  ): Promise<void> {
    try {
      logger.info(`Starting processing for document ${documentId}`);

      // Step 1: Assess document quality
      const quality = await VisionService.assessQuality(imageBuffer, mimeType);
      logger.info(`Quality assessment for ${documentId}:`, quality);

      // If quality is poor, mark as red
      if (quality.overallQuality === 'poor' || quality.qualityScore < 50) {
        await this.updateDocumentStatus(documentId, 'red', {
          confidence: quality.qualityScore / 100,
          validationResults: {
            quality,
            issues: ['Poor image quality', 'Please upload a clearer image']
          },
          reviewNotes: 'Document rejected due to poor image quality'
        });
        logger.info(`Document ${documentId} marked as red due to poor quality`);
        return;
      }

      // Step 2: Extract fields using Vision AI
      const { data: extractedData, confidence } = await VisionService.extractFields(
        imageBuffer,
        mimeType,
        documentType
      );

      logger.info(`Extracted data from ${documentId} with confidence ${confidence}`);

      // Step 3: Validate extracted data
      const validation = VisionService.validateExtractedData(extractedData, documentType);

      // Step 4: Determine status based on confidence and validation
      let status: DocumentStatus;
      let reviewNotes = '';

      if (!validation.isValid || confidence < 0.6) {
        // Red: Invalid or low confidence
        status = 'red';
        reviewNotes = `Validation failed: ${validation.errors.join(', ')}`;
      } else if (confidence < 0.8 || validation.warnings.length > 0) {
        // Yellow: Needs manual review
        status = 'yellow';
        reviewNotes = validation.warnings.length > 0
          ? `Warnings: ${validation.warnings.join(', ')}`
          : 'Moderate confidence - requires manual review';
      } else {
        // Green: High confidence and valid
        status = 'green';
        reviewNotes = 'Automatically verified';
      }

      // Step 5: Update document with results
      await this.updateDocumentStatus(documentId, status, {
        confidence,
        extractedData,
        validationResults: {
          quality,
          validation,
          processedAt: new Date().toISOString()
        },
        reviewNotes
      });

      logger.info(`Document ${documentId} processed successfully with status: ${status}`);

      // Step 6: Send notifications based on status
      const document = await DocumentRepository.findById(documentId);
      if (document) {
        await this.sendDocumentNotification(document, status);
        
        // Update user progress if document is verified
        if (status === 'green') {
          await UserService.updateTaskProgress(document.user_id, documentId, 'completed');
        }
      }
    } catch (error) {
      logger.error(`Error processing document ${documentId}:`, error);

      // Mark as yellow for manual review on error
      await this.updateDocumentStatus(documentId, 'yellow', {
        confidence: 0,
        reviewNotes: 'Processing failed - requires manual review'
      }).catch(err => {
        logger.error(`Failed to update document status after error:`, err);
      });
    }
  }

  /**
   * Send notification based on document status
   */
  private async sendDocumentNotification(document: Document, status: DocumentStatus): Promise<void> {
    try {
      let notificationType: 'document_verified' | 'document_rejected' | 'document_needs_review';
      let message: string;
      let priority = 5;

      switch (status) {
        case 'green':
          notificationType = 'document_verified';
          message = `Your ${document.document_type} has been verified successfully! ✅`;
          priority = 3;
          break;
        case 'red':
          notificationType = 'document_rejected';
          message = `Your ${document.document_type} was rejected. Please upload a clearer image. ❌`;
          priority = 2;
          break;
        case 'yellow':
          notificationType = 'document_needs_review';
          message = `Your ${document.document_type} is under review. We'll notify you once it's verified. ⏳`;
          priority = 4;
          break;
        default:
          return;
      }

      // Add notification to queue
      await QueueService.addNotificationJob({
        userId: document.user_id,
        type: notificationType,
        documentId: document.id,
        message,
        priority
      });

      logger.info(`Notification queued for document ${document.id} with status ${status}`);
    } catch (error) {
      logger.error(`Error sending document notification:`, error);
      // Don't throw - notification failure shouldn't break document processing
    }
  }
}

export default new DocumentService();
