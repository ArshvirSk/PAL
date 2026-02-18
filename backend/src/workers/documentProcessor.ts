import { documentProcessingQueue } from '../services/QueueService';
import DocumentService from '../services/DocumentService';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../config/database';

// Process document jobs
documentProcessingQueue.process(async (job) => {
  const { documentId, fileUrl } = job.data;
  
  logger.info(`Processing document ${documentId} from queue`);

  try {
    // Download file from Supabase Storage
    const fileName = fileUrl.split('/documents/')[1];
    const { data: fileData, error } = await supabaseAdmin.storage
      .from('documents')
      .download(fileName);

    if (error || !fileData) {
      throw new Error(`Failed to download file: ${error?.message}`);
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const mimeType = fileData.type;

    // Process document (this will update status and extract data)
    await (DocumentService as any).processDocument(
      documentId,
      buffer,
      mimeType,
      job.data.documentType
    );

    return { success: true, documentId };
  } catch (error) {
    logger.error(`Error in document processing worker for ${documentId}:`, error);
    throw error;
  }
});

logger.info('Document processing worker started');
