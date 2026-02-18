import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import QueueService from './QueueService';

export type NotificationType = 
  | 'document_verified'
  | 'document_rejected'
  | 'document_needs_review'
  | 'deadline_reminder'
  | 'phase_completed'
  | 'task_reminder'
  | 'announcement'
  | 'mentor_alert';

export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push' | 'in_app';

interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
  push: boolean;
  in_app: boolean;
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string;
}

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  priority?: number;
  metadata?: Record<string, any>;
}

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  priority: number;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sent_at?: Date;
  read_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
}

class NotificationService {
  /**
   * Create and send a notification
   */
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    try {
      const {
        userId,
        type,
        title,
        message,
        channels = ['in_app'],
        priority = 5,
        metadata = {}
      } = input;

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Check quiet hours
      if (this.isQuietHours(preferences)) {
        logger.info(`Notification queued due to quiet hours for user ${userId}`);
        // Queue for later delivery
        await this.queueForLater(input);
        return await this.saveNotification({
          ...input,
          status: 'pending'
        });
      }

      // Filter channels based on preferences
      const allowedChannels = channels.filter(channel => 
        preferences[channel] !== false
      );

      // Save notification to database
      const notification = await this.saveNotification({
        userId,
        type,
        title,
        message,
        channels: allowedChannels,
        priority,
        metadata,
        status: 'pending'
      });

      // Send through each channel
      await this.sendThroughChannels(notification, allowedChannels);

      // Update status to sent
      await this.updateNotificationStatus(notification.id, 'sent');

      logger.info(`Notification ${notification.id} sent to user ${userId}`);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Save notification to database
   */
  private async saveNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    channels: NotificationChannel[];
    priority: number;
    metadata: Record<string, any>;
    status: 'pending' | 'sent' | 'failed';
  }): Promise<Notification> {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        channels: data.channels,
        priority: data.priority,
        status: data.status,
        metadata: data.metadata,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  /**
   * Send notification through multiple channels
   */
  private async sendThroughChannels(
    notification: Notification,
    channels: NotificationChannel[]
  ): Promise<void> {
    const promises = channels.map(channel => {
      switch (channel) {
        case 'whatsapp':
          return this.sendWhatsApp(notification);
        case 'sms':
          return this.sendSMS(notification);
        case 'email':
          return this.sendEmail(notification);
        case 'push':
          return this.sendPush(notification);
        case 'in_app':
          return Promise.resolve(); // Already saved in DB
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Send WhatsApp notification (Twilio)
   */
  private async sendWhatsApp(notification: Notification): Promise<void> {
    try {
      // Get user phone
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('phone')
        .eq('id', notification.user_id)
        .single();

      if (!user?.phone) {
        logger.warn(`No phone number for user ${notification.user_id}`);
        return;
      }

      // TODO: Implement Twilio WhatsApp sending
      // For now, just log
      logger.info(`WhatsApp notification would be sent to ${user.phone}:`, {
        title: notification.title,
        message: notification.message
      });

      /* PRODUCTION CODE:
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${user.phone}`,
        body: `${notification.title}\n\n${notification.message}`
      });
      */
    } catch (error) {
      logger.error('Error sending WhatsApp:', error);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(notification: Notification): Promise<void> {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('phone')
        .eq('id', notification.user_id)
        .single();

      if (!user?.phone) return;

      logger.info(`SMS would be sent to ${user.phone}:`, {
        message: notification.message
      });

      // TODO: Implement SMS sending via Twilio
    } catch (error) {
      logger.error('Error sending SMS:', error);
    }
  }

  /**
   * Send Email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    try {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, full_name')
        .eq('id', notification.user_id)
        .single();

      if (!user?.email) return;

      logger.info(`Email would be sent to ${user.email}:`, {
        title: notification.title,
        message: notification.message
      });

      // TODO: Implement email sending via SendGrid/AWS SES
    } catch (error) {
      logger.error('Error sending email:', error);
    }
  }

  /**
   * Send Push notification
   */
  private async sendPush(notification: Notification): Promise<void> {
    try {
      logger.info(`Push notification for user ${notification.user_id}:`, {
        title: notification.title,
        message: notification.message
      });

      // TODO: Implement push notifications via Firebase
    } catch (error) {
      logger.error('Error sending push:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      return data?.notification_preferences || {
        whatsapp: true,
        sms: true,
        email: true,
        push: true,
        in_app: true
      };
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      return {
        whatsapp: true,
        sms: true,
        email: true,
        push: true,
        in_app: true
      };
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * Queue notification for later delivery
   */
  private async queueForLater(input: CreateNotificationInput): Promise<void> {
    await QueueService.addNotificationJob({
      userId: input.userId,
      type: input.type as any,
      documentId: input.metadata?.documentId || '',
      message: input.message,
      priority: input.priority
    });
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: 'pending' | 'sent' | 'failed' | 'read'
  ): Promise<void> {
    const updates: any = { status };
    
    if (status === 'sent') {
      updates.sent_at = new Date();
    } else if (status === 'read') {
      updates.read_at = new Date();
    }

    await supabaseAdmin
      .from('notifications')
      .update(updates)
      .eq('id', notificationId);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.updateNotificationStatus(notificationId, 'read');
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await supabaseAdmin
      .from('notifications')
      .update({ status: 'read', read_at: new Date() })
      .eq('user_id', userId)
      .is('read_at', null);
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    userIds: string[],
    notification: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    const promises = userIds.map(userId =>
      this.createNotification({ ...notification, userId })
    );

    await Promise.allSettled(promises);
    logger.info(`Bulk notifications sent to ${userIds.length} users`);
  }

  /**
   * Send deadline reminders
   */
  async sendDeadlineReminders(): Promise<void> {
    try {
      // Get tasks due within 48 hours
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setHours(twoDaysFromNow.getHours() + 48);

      const { data: tasks } = await supabaseAdmin
        .from('user_tasks')
        .select('*, users(id, full_name)')
        .eq('status', 'not_started')
        .lte('deadline', twoDaysFromNow.toISOString())
        .is('reminder_sent', false);

      if (!tasks || tasks.length === 0) return;

      for (const task of tasks) {
        await this.createNotification({
          userId: task.user_id,
          type: 'deadline_reminder',
          title: 'Task Deadline Approaching',
          message: `Your task "${task.task_definition.title}" is due soon!`,
          channels: ['whatsapp', 'in_app'],
          priority: 2,
          metadata: { taskId: task.id }
        });

        // Mark reminder as sent
        await supabaseAdmin
          .from('user_tasks')
          .update({ reminder_sent: true })
          .eq('id', task.id);
      }

      logger.info(`Sent ${tasks.length} deadline reminders`);
    } catch (error) {
      logger.error('Error sending deadline reminders:', error);
    }
  }
}

export default new NotificationService();
