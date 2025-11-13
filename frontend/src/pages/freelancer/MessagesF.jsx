import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { io } from 'socket.io-client';
import 'react-toastify/dist/ReactToastify.css';

export default function Messages() {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Get current user ID from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);
            } catch (error) {
                console.error('Error parsing token:', error);
                toast.error('Authentication error. Please log in again.');
                return;
            }
        }

        fetchConversations();

        // Initialize Socket.IO
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        // Join with user ID
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                newSocket.emit('join', payload.id);
            } catch (error) {
                console.error('Error with socket:', error);
            }
        }

        // Listen for incoming messages
        newSocket.on('receiveMessage', (message) => {
            setMessages((prev) => {
                // Check if message already exists
                if (prev.some(m => m._id === message._id)) {
                    return prev;
                }
                return [...prev, message];
            });
            fetchConversations();
        });

        // Listen for message read status
        newSocket.on('messageRead', ({ conversationId }) => {
            setMessages((prev) =>
                prev.map((msg) => ({ ...msg, isRead: true }))
            );
            fetchConversations();
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/messages/conversations', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConversations(res.data.conversations || []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/messages/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(res.data.messages || []);

            // Mark as read and notify
            try {
                await axios.patch(
                    `http://localhost:5000/api/messages/${conversationId}/read`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // Notify other user via socket
                if (socket && selectedConversation) {
                    const otherParticipant = selectedConversation.participants.find(
                        (p) => p.userId !== currentUserId
                    );
                    if (otherParticipant) {
                        socket.emit('messageRead', {
                            conversationId,
                            receiverId: otherParticipant.userId,
                        });
                    }
                }

                fetchConversations(); // Refresh to update unread count
            } catch (readErr) {
                console.error('Failed to mark as read:', readErr);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            // Don't show error toast, just log it
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        const conversationId = conversation.participants
            .map((p) => p.userId)
            .sort()
            .join('_');
        fetchMessages(conversationId);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const otherParticipant = selectedConversation.participants.find(
                (p) => p.userId !== currentUserId
            );

            const conversationId = selectedConversation.participants
                .map((p) => p.userId)
                .sort()
                .join('_');

            const res = await axios.post(
                'http://localhost:5000/api/messages/send',
                {
                    conversationId,
                    receiverId: otherParticipant.userId,
                    message: newMessage,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Emit via Socket.IO
            if (socket) {
                socket.emit('sendMessage', {
                    receiverId: otherParticipant.userId,
                    message: res.data.message,
                });
            }

            setMessages((prev) => [...prev, res.data.message]);
            setNewMessage('');
            fetchConversations();
        } catch (err) {
            console.error('Failed to send message:', err);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (d.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const getUnreadCount = (conv) => {
        if (!conv.unreadCount) return 0;
        const unreadMap = new Map(Object.entries(conv.unreadCount));
        return unreadMap.get(currentUserId) || 0;
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status"></div>
                    <p className="mt-2">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0" style={{ height: 'calc(100vh - 80px)' }}>
            <ToastContainer position="top-right" />

            <div className="row h-100 g-0 m-0">
                {/* Conversations List */}
                <div className="col-md-4 col-lg-3 h-100 p-0">
                    <div className="h-100" style={{ borderRight: '1px solid #dee2e6', overflow: 'hidden' }}>
                        <div
                            className="card-header text-white"
                            style={{
                                background: 'linear-gradient(135deg, #0F9D58 0%, #0c7a45 100%)',
                                padding: '1.25rem',
                                borderBottom: 'none'
                            }}
                        >
                            <h5 className="mb-0 fw-bold">💬 Messages</h5>
                            <small style={{ opacity: 0.9 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</small>
                        </div>
                        <div className="card-body p-0" style={{ overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                            {conversations.length === 0 ? (
                                <div className="text-center py-5 px-3">
                                    <div style={{ fontSize: '4rem', opacity: 0.3 }}>📭</div>
                                    <h6 className="text-muted mt-3">No conversations yet</h6>
                                    <small className="text-muted">Start a chat from proposals</small>
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
                                    const unreadCount = getUnreadCount(conv);
                                    const isSelected = selectedConversation?._id === conv._id;

                                    return (
                                        <div
                                            key={conv._id}
                                            className={`p-3 border-bottom ${isSelected ? 'bg-white' : ''}`}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                backgroundColor: isSelected ? '#fff' : 'transparent',
                                                borderLeft: isSelected ? '4px solid #0F9D58' : '4px solid transparent'
                                            }}
                                            onClick={() => handleSelectConversation(conv)}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) e.currentTarget.style.backgroundColor = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                <div className="position-relative">
                                                    <div
                                                        className="text-white rounded-circle d-flex align-items-center justify-content-center"
                                                        style={{
                                                            width: 50,
                                                            height: 50,
                                                            fontSize: '1.3rem',
                                                            background: 'linear-gradient(135deg, #0F9D58 0%, #0c7a45 100%)',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {otherParticipant?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {unreadCount > 0 && (
                                                        <div
                                                            className="position-absolute bg-primary rounded-circle"
                                                            style={{
                                                                width: 12,
                                                                height: 12,
                                                                top: 0,
                                                                right: 0,
                                                                border: '2px solid white'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <div className="ms-3 flex-grow-1" style={{ minWidth: 0 }}>
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <strong className="text-truncate" style={{ fontSize: '0.95rem' }}>
                                                            {otherParticipant?.name || 'Unknown'}
                                                        </strong>
                                                        {unreadCount > 0 && (
                                                            <span
                                                                className="badge rounded-pill"
                                                                style={{
                                                                    backgroundColor: '#0F9D58',
                                                                    fontSize: '0.7rem',
                                                                    padding: '0.25rem 0.5rem'
                                                                }}
                                                            >
                                                                {unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <small
                                                            className="text-muted text-truncate d-block"
                                                            style={{
                                                                maxWidth: '70%',
                                                                fontWeight: unreadCount > 0 ? '600' : 'normal'
                                                            }}
                                                        >
                                                            {conv.lastMessage || 'No messages yet'}
                                                        </small>
                                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {formatDate(conv.lastMessageTime)}
                                                        </small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Window */}
                <div className="col-md-8 col-lg-9 h-100 p-0">
                    {selectedConversation ? (
                        <div className="h-100" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {/* Chat Header */}
                            <div
                                className="bg-white border-bottom"
                                style={{ padding: '1rem 1.5rem', flexShrink: 0 }}
                            >
                                {(() => {
                                    const otherParticipant = selectedConversation.participants.find(
                                        (p) => p.userId !== currentUserId
                                    );
                                    return (
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="text-white rounded-circle d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: 45,
                                                    height: 45,
                                                    fontSize: '1.2rem',
                                                    background: 'linear-gradient(135deg, #0F9D58 0%, #0c7a45 100%)',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {otherParticipant?.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div className="ms-3">
                                                <h6 className="mb-0 fw-bold">{otherParticipant?.name || 'Unknown'}</h6>
                                                <small className="text-muted">{otherParticipant?.role || ''}</small>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Messages */}
                            <div
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
                                    padding: '1.5rem',
                                    minHeight: 0
                                }}
                            >
                                {messages.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div style={{ fontSize: '4rem', opacity: 0.3 }}>💬</div>
                                        <h5 className="text-muted mt-3">No messages yet</h5>
                                        <p className="text-muted">Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isOwn = msg.senderId === currentUserId;

                                        return (
                                            <div
                                                key={msg._id || idx}
                                                className={`d-flex mb-3 ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}
                                            >
                                                <div
                                                    style={{
                                                        maxWidth: '70%',
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        background: isOwn
                                                            ? 'linear-gradient(135deg, #0F9D58 0%, #0c7a45 100%)'
                                                            : '#fff',
                                                        color: isOwn ? '#fff' : '#333',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    <p className="mb-1" style={{ wordBreak: 'break-word', margin: 0 }}>
                                                        {msg.message}
                                                    </p>
                                                    <div className="d-flex justify-content-end align-items-center gap-1 mt-1">
                                                        <small style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </small>
                                                        {isOwn && (
                                                            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                                                                {msg.isRead ? (
                                                                    <span style={{ color: '#4FC3F7' }}>✓✓</span>
                                                                ) : (
                                                                    <span style={{ opacity: 0.7 }}>✓✓</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="bg-white border-top" style={{ padding: '1rem 1.5rem', flexShrink: 0 }}>
                                <form onSubmit={handleSendMessage}>
                                    <div className="d-flex gap-2 align-items-center">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={sending}
                                            style={{
                                                borderRadius: 25,
                                                padding: '0.75rem 1.25rem',
                                                border: '2px solid #e9ecef',
                                                fontSize: '0.95rem'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
                                            disabled={sending || !newMessage.trim()}
                                            style={{
                                                width: 45,
                                                height: 45,
                                                padding: 0,
                                                background: 'linear-gradient(135deg, #0F9D58 0%, #0c7a45 100%)',
                                                border: 'none',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            {sending ? '...' : '📤'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center bg-light">
                            <div className="text-center p-5">
                                <div style={{ fontSize: '5rem', opacity: 0.2 }}>💬</div>
                                <h4 className="mt-4 mb-2">Select a conversation</h4>
                                <p className="text-muted">Choose a conversation from the list to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
