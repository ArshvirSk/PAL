import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import ChatService from '../services/ChatService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/chat/conversations
 * Create a new conversation
 */
router.post('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body;

    const conversation = await ChatService.createConversation(userId, title);

    res.status(201).json({
      success: true,
      data: {
        conversation: conversation
      }
    });
  } catch (error: any) {
    logger.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});

/**
 * GET /api/v1/chat/conversations
 * Get user conversations
 */
router.get('/conversations', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : 20;

    const conversations = await ChatService.getUserConversations(userId, limit);

    res.json({
      success: true,
      data: {
        conversations: conversations
      }
    });
  } catch (error: any) {
    logger.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});

/**
 * GET /api/v1/chat/conversations/:id
 * Get a specific conversation
 */
router.get('/conversations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const conversation = await ChatService.getConversation(id as string);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Check ownership
    if (conversation.user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    logger.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    });
  }
});

/**
 * POST /api/v1/chat/message
 * Send a message and get AI response
 */
router.post('/message', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { conversationId, content, branch, phase } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and content are required'
      });
    }

    // Verify conversation ownership
    const conversation = await ChatService.getConversation(conversationId as string);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    if (conversation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const response = await ChatService.sendMessage(userId, conversationId, content, {
      branch,
      phase
    });

    res.json({
      success: true,
      data: {
        messageId: response.message.id,
        response: response.message.content,
        message: response.message,
        sources: response.sources,
        confidence: response.confidence
      }
    });
  } catch (error: any) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * GET /api/v1/chat/conversations/:id/messages
 * Get conversation messages
 */
router.get('/conversations/:id/messages', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const limitParam = req.query.limit;
    const limit = limitParam ? parseInt(limitParam as string) : 50;

    // Verify conversation ownership
    const conversation = await ChatService.getConversation(id as string);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    if (conversation.user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const messages = await ChatService.getMessages(id as string, limit);

    res.json({
      success: true,
      data: {
        messages: messages
      }
    });
  } catch (error: any) {
    logger.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
});

/**
 * DELETE /api/v1/chat/conversations/:id
 * Delete a conversation
 */
router.delete('/conversations/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Verify conversation ownership
    const conversation = await ChatService.getConversation(id as string);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    if (conversation.user_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await ChatService.deleteConversation(id as string);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

export default router;
