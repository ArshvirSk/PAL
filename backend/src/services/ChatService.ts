import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';
import RAGService from './RAGService';
import SentimentService from './SentimentService';
import { redisClient } from '../config/redis';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  language: 'en' | 'hi';
  sentiment_score?: number;
  timestamp: Date;
  channel?: string;
  confidence?: number;
  sources?: any;
}

interface Conversation {
  id: string;
  user_id: string;
  channel: string;
  started_at: Date;
  last_message_at: Date;
  context?: any;
}

interface ChatResponse {
  message: Message;
  sources?: Array<{
    content: string;
    metadata: any;
    score: number;
  }>;
  confidence?: number;
}

class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string): Promise<Conversation> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: userId,
          channel: 'web',
          started_at: new Date(),
          last_message_at: new Date(),
          context: { title: title || 'New Conversation' }
        })
        .select()
        .single();

      if (error) throw error;

      logger.info(`Created conversation ${data.id} for user ${userId}`);
      return data;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string, limit: number = 20): Promise<Conversation[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    options: {
      branch?: string;
      phase?: string;
    } = {}
  ): Promise<ChatResponse> {
    try {
      // Detect language
      const language = this.detectLanguage(content);

      // Save user message
      const userMessage = await this.saveMessage({
        conversation_id: conversationId,
        sender_type: 'user' as 'user' | 'assistant',
        content,
        language
      });

      // Analyze sentiment (async, don't wait)
      SentimentService.analyzeMessage(userId, userMessage.id, content).catch(err => {
        logger.error('Error analyzing sentiment:', err);
      });

      // Get conversation context from Redis
      const context = await this.getConversationContext(conversationId);

      // Query RAG system
      const ragResponse = await RAGService.query(content, {
        userId,
        branch: options.branch,
        phase: options.phase,
        language,
        maxResults: 5
      });

      // Check confidence - if too low, escalate
      if (ragResponse.confidence < 0.5) {
        const escalationMessage = language === 'hi'
          ? 'मुझे इस प्रश्न का पूरा उत्तर नहीं मिल रहा है। क्या मैं आपको किसी व्यवस्थापक से जोड़ दूं?'
          : "I'm not fully confident about this answer. Would you like me to connect you with an administrator?";

        const assistantMessage = await this.saveMessage({
          conversation_id: conversationId,
          sender_type: 'assistant' as 'user' | 'assistant',
          content: escalationMessage,
          language
        });

        return {
          message: assistantMessage,
          sources: ragResponse.sources,
          confidence: ragResponse.confidence
        };
      }

      // Save assistant response
      const assistantMessage = await this.saveMessage({
        conversation_id: conversationId,
        sender_type: 'assistant' as 'user' | 'assistant',
        content: ragResponse.answer,
        language
      });

      // Update conversation context in Redis
      await this.updateConversationContext(conversationId, {
        lastMessage: content,
        lastResponse: ragResponse.answer,
        timestamp: new Date().toISOString()
      });

      // Update conversation last_message_at
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date() })
        .eq('id', conversationId);

      return {
        message: assistantMessage,
        sources: ragResponse.sources,
        confidence: ragResponse.confidence
      };
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error getting messages:', error);
      return [];
    }
  }

  /**
   * Save a message
   */
  private async saveMessage(data: {
    conversation_id: string;
    sender_type: 'user' | 'assistant';
    content: string;
    language: 'en' | 'hi';
    sentiment_score?: number;
  }): Promise<Message> {
    try {
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: data.conversation_id,
          role: data.sender_type,
          content: data.content,
          language: data.language,
          sentiment_score: data.sentiment_score,
          timestamp: new Date(),
          channel: 'web'
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      logger.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Detect language
   */
  private detectLanguage(text: string): 'en' | 'hi' {
    const hindiPattern = /[\u0900-\u097F]/;
    return hindiPattern.test(text) ? 'hi' : 'en';
  }

  /**
   * Get conversation context from Redis
   */
  private async getConversationContext(conversationId: string): Promise<any> {
    try {
      if (!redisClient?.isOpen) return null;

      const key = `conversation:${conversationId}:context`;
      const context = await redisClient.get(key);
      return context ? JSON.parse(context) : null;
    } catch (error) {
      logger.warn('Error getting conversation context from Redis:', error);
      return null;
    }
  }

  /**
   * Update conversation context in Redis
   */
  private async updateConversationContext(conversationId: string, context: any): Promise<void> {
    try {
      if (!redisClient?.isOpen) return;

      const key = `conversation:${conversationId}:context`;
      await redisClient.setEx(key, 3600, JSON.stringify(context)); // 1 hour TTL
    } catch (error) {
      logger.warn('Error updating conversation context in Redis:', error);
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Delete messages first
      await supabaseAdmin
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete conversation
      await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      // Clear Redis context
      if (redisClient?.isOpen) {
        await redisClient.del(`conversation:${conversationId}:context`);
      }

      logger.info(`Deleted conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

export default new ChatService();
