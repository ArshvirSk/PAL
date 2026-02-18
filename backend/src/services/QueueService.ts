import Bull from 'bull';
import { logger } from '../utils/logger';

// Redis configuration
const redisConfig = process.env.REDIS_URL
  ? {
      redis: process.env.REDIS_URL
    }
  : {
      redis: {
        host: 'localhost',
        port: 6379
      }
    };

// Create queues
export const documentProcessingQueue = new Bull('document-processing', redisConfig);
export const notificationQueue = new Bull('notifications', redisConfig);

// Queue event handlers
documentProcessingQueue.on('completed', (job) => {
  logger.info(`Document processing job ${job.id} completed`);
});

documentProcessingQueue.on('failed', (job, err) => {
  logger.error(`Document processing job ${job?.id} failed:`, err);
});

notificationQueue.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationQueue.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing queues...');
  await documentProcessingQueue.close();
  await notificationQueue.close();
});

export class QueueService {
  /**
   * Add document processing job to queue
   */
  static async addDocumentProcessingJob(data: {
    documentId: string;
    userId: string;
    documentType: string;
    fileUrl: string;
  }): Promise<Bull.Job> {
    return documentProcessingQueue.add(data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: true,
      removeOnFail: false
    });
  }

  /**
   * Add notification job to queue
   */
  static async addNotificationJob(data: {
    userId: string;
    type: 'document_verified' | 'document_rejected' | 'document_needs_review';
    documentId: string;
    message: string;
    priority?: number;
  }): Promise<Bull.Job> {
    return notificationQueue.add(data, {
      priority: data.priority || 5,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true
    });
  }

  /**
   * Get queue stats
   */
  static async getQueueStats() {
    const [docWaiting, docActive, docCompleted, docFailed] = await Promise.all([
      documentProcessingQueue.getWaitingCount(),
      documentProcessingQueue.getActiveCount(),
      documentProcessingQueue.getCompletedCount(),
      documentProcessingQueue.getFailedCount()
    ]);

    const [notifWaiting, notifActive, notifCompleted, notifFailed] = await Promise.all([
      notificationQueue.getWaitingCount(),
      notificationQueue.getActiveCount(),
      notificationQueue.getCompletedCount(),
      notificationQueue.getFailedCount()
    ]);

    return {
      documentProcessing: {
        waiting: docWaiting,
        active: docActive,
        completed: docCompleted,
        failed: docFailed
      },
      notifications: {
        waiting: notifWaiting,
        active: notifActive,
        completed: notifCompleted,
        failed: notifFailed
      }
    };
  }
}

export default QueueService;
