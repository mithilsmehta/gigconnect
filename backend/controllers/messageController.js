import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';

// Get or create conversation
export const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId, jobId, jobTitle } = req.body;
    const currentUserId = req.userId;

    // Get both users
    const currentUser = await User.findById(currentUserId);
    const otherUser = await User.findById(otherUserId);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [currentUserId, otherUserId].sort().join('_');

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [
          {
            userId: currentUserId,
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            role: currentUser.role,
          },
          {
            userId: otherUserId,
            name: `${otherUser.firstName} ${otherUser.lastName}`,
            role: otherUser.role,
          },
        ],
        jobId: jobId || null,
        jobTitle: jobTitle || null,
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0,
        },
      });

      await conversation.save();
    }

    res.json({
      success: true,
      conversation,
      conversationId,
    });
  } catch (error) {
    console.error('Get/Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
};

// Get all conversations for a user
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      'participants.userId': userId,
    })
      .sort({ lastMessageTime: -1 })
      .limit(50);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).limit(100);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    );

    // Reset unread count for this user
    await Conversation.updateOne({ 'participants.userId': userId }, { $set: { [`unreadCount.${userId}`]: 0 } });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, receiverId, message, fileUrl, fileName, fileType } = req.body;
    const senderId = req.userId;

    // Get sender and receiver info
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create message
    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId,
      senderName: `${sender.firstName} ${sender.lastName}`,
      receiverName: `${receiver.firstName} ${receiver.lastName}`,
      message: message || '',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
    });

    await newMessage.save();

    // Update conversation
    await Conversation.findOneAndUpdate(
      { 'participants.userId': { $all: [senderId, receiverId] } },
      {
        $set: {
          lastMessage: message || (fileName ? `📎 ${fileName}` : 'File'),
          lastMessageTime: new Date(),
        },
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      },
    );

    res.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    );

    await Conversation.updateOne({ 'participants.userId': userId }, { $set: { [`unreadCount.${userId}`]: 0 } });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};
