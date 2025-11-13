import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getOrCreateConversation,
  getUserConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from '../controllers/messageController.js';

const router = express.Router();

// Get or create conversation
router.post('/conversation', requireAuth, getOrCreateConversation);

// Get all conversations for user
router.get('/conversations', requireAuth, getUserConversations);

// Get messages for a conversation
router.get('/:conversationId', requireAuth, getMessages);

// Send a message
router.post('/send', requireAuth, sendMessage);

// Mark messages as read
router.patch('/:conversationId/read', requireAuth, markAsRead);

export default router;
