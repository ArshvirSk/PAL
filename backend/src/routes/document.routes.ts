import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import DocumentService from '../services/DocumentService';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
    }
  }
});

/**
 * POST /api/v1/documents/upload
 * Upload a document
 */
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { documentType } = req.body;
    const file = req.file;
    const userId = req.user!.userId;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    // Valid document types
    const validTypes = [
      'marksheet_10th',
      'marksheet_12th',
      'id_proof',
      'photo',
      'fee_receipt',
      'medical_certificate',
      'other'
    ];

    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid document type. Allowed types: ${validTypes.join(', ')}`
      });
    }

    const document = await DocumentService.uploadDocument({
      userId,
      documentType,
      file
    });

    // Format document for frontend
    const formattedDoc = {
      id: document.id,
      fileName: file.originalname,
      documentType: document.document_type,
      fileSize: file.size,
      verificationStatus: document.status,
      confidence: document.confidence,
      extractedData: document.extracted_data,
      validationIssues: [],
      rejectionReason: document.review_notes,
      uploadedAt: document.uploaded_at,
      verifiedAt: document.verified_at
    };

    res.status(201).json({
      success: true,
      data: {
        document: formattedDoc
      },
      message: 'Document uploaded successfully. Processing will begin shortly.'
    });
  } catch (error: any) {
    logger.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload document'
    });
  }
});

/**
 * GET /api/v1/documents
 * Get all documents for authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const documents = await DocumentService.getUserDocuments(userId);

    // Format documents for frontend
    const formattedDocs = documents.map((doc: any) => {
      // Extract filename from URL
      let fileName = doc.document_type;
      if (doc.original_file_url) {
        const urlParts = doc.original_file_url.split('/');
        const fileNameWithTimestamp = urlParts[urlParts.length - 1];
        // Remove timestamp prefix (e.g., "1234567890_filename.jpg" -> "filename.jpg")
        fileName = fileNameWithTimestamp.replace(/^\d+_/, '') || doc.document_type;
      }
      
      return {
        id: doc.id,
        fileName: fileName,
        documentType: doc.document_type,
        fileSize: 0, // Not stored in DB
        verificationStatus: doc.status,
        confidence: doc.confidence,
        extractedData: doc.extracted_data,
        validationIssues: doc.validation_results?.validation?.errors || [],
        rejectionReason: doc.review_notes,
        uploadedAt: doc.uploaded_at,
        verifiedAt: doc.verified_at
      };
    });

    res.json({
      success: true,
      data: {
        documents: formattedDocs
      }
    });
  } catch (error: any) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

/**
 * GET /api/v1/documents/:id
 * Get a specific document
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const document = await DocumentService.getDocument(id as string);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check ownership
    if (document.user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error: any) {
    logger.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document'
    });
  }
});

/**
 * GET /api/v1/documents/type/:type
 * Get documents by type for authenticated user
 */
router.get('/type/:type', authenticate, async (req: Request, res: Response) => {
  try {
    const type = req.params.type as string;
    const userId = req.user!.userId;

    const documents = await DocumentService.getUserDocumentsByType(userId, type);

    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    logger.error('Error fetching documents by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documents'
    });
  }
});

/**
 * DELETE /api/v1/documents/:id
 * Delete a document
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const document = await DocumentService.getDocument(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check ownership
    if (document.user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await DocumentService.deleteDocument(id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

/**
 * GET /api/v1/documents/pending/verification
 * Get documents pending verification (admin only)
 */
router.get('/pending/verification', authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin only.'
      });
    }

    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : 50;
    const documents = await DocumentService.getPendingDocuments(limit);

    res.json({
      success: true,
      data: documents
    });
  } catch (error: any) {
    logger.error('Error fetching pending documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending documents'
    });
  }
});

export default router;
