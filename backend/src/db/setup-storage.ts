import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

async function setupStorage() {
  try {
    logger.info('Setting up Supabase Storage...');

    // Create documents bucket
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      logger.error('Error listing buckets:', listError);
      throw listError;
    }

    const documentsBucketExists = buckets?.some(b => b.name === 'documents');

    if (!documentsBucketExists) {
      const { data, error } = await supabaseAdmin.storage.createBucket('documents', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/pdf'
        ]
      });

      if (error) {
        logger.error('Error creating documents bucket:', error);
        throw error;
      }

      logger.info('✅ Documents bucket created');
    } else {
      logger.info('✅ Documents bucket already exists');
    }

    logger.info('✅ Storage setup completed successfully');
  } catch (error) {
    logger.error('❌ Storage setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupStorage()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

export default setupStorage;
