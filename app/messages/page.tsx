'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import ProBadge from '../components/ProBadge';
import styles from '../styles/Messages.module.css';

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string | null;
    isPro?: boolean;
  };
  unreadCount: number;
  lastMessage: {
    content: string;
    created_at: string;
  } | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Refresh conversations to update unread counts
      fetchConversations();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUserId(session.user.id);
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        
        // If no conversation selected and we have conversations, select the first one
        if (!selectedConversation && data.conversations && data.conversations.length > 0) {
          setSelectedConversation(data.conversations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/messages?conversation_id=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        const error = await response.json();
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createUserSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.messages} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Messages</h2>
          </ScrollAnimation>

          <div className={styles.messagesLayout}>
            {/* Conversations List */}
            <div className={styles.conversationsList}>
              <div className={styles.conversationsHeader}>
                <h3 className={styles.conversationsTitle}>Conversations</h3>
              </div>
              
              {conversations.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No conversations yet. Start messaging other users!</p>
                </div>
              ) : (
                <div className={styles.conversationItems}>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`${styles.conversationItem} ${selectedConversation?.id === conv.id ? styles.active : ''}`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className={styles.conversationAvatar} style={{ position: 'relative' }}>
                        {conv.otherUser.avatar ? (
                          <Image
                            src={conv.otherUser.avatar}
                            alt={conv.otherUser.name}
                            width={50}
                            height={50}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {conv.otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {conv.otherUser.isPro && <ProBadge size={16} />}
                        {conv.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                        )}
                      </div>
                      <div className={styles.conversationInfo}>
                        <div className={styles.conversationHeaderRow}>
                          <span className={styles.conversationName}>{conv.otherUser.name}</span>
                          {conv.lastMessage && (
                            <span className={styles.conversationTime}>
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={styles.conversationPreview}>
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Messages View */}
            <div className={styles.messagesView}>
              {selectedConversation ? (
                <>
                  <div className={styles.messagesHeader}>
                    <div className={styles.messagesHeaderUser}>
                      <div style={{ position: 'relative' }}>
                        {selectedConversation.otherUser.avatar ? (
                          <Image
                            src={selectedConversation.otherUser.avatar}
                            alt={selectedConversation.otherUser.name}
                            width={40}
                            height={40}
                            style={{ borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className={styles.headerAvatarPlaceholder}>
                            {selectedConversation.otherUser.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {selectedConversation.otherUser.isPro && <ProBadge size={14} />}
                      </div>
                      <span className={styles.messagesHeaderName}>
                        {selectedConversation.otherUser.name}
                      </span>
                    </div>
                    <Link
                      href={`/artist/${createUserSlug(selectedConversation.otherUser.name)}`}
                      className={styles.viewProfileLink}
                    >
                      View Profile
                    </Link>
                  </div>

                  <div className={styles.messagesContainer}>
                    {messagesLoading ? (
                      <div className={styles.loading}>Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className={styles.emptyMessages}>
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`${styles.message} ${message.sender_id === userId ? styles.sent : styles.received}`}
                        >
                          <div className={styles.messageContent}>
                            <p>{message.content}</p>
                            <span className={styles.messageTime}>
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className={styles.messageInput}>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={2}
                      maxLength={1000}
                      className={styles.messageTextarea}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className={styles.sendButton}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.noConversationSelected}>
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

