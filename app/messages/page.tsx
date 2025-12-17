'use client';

import { useState, useEffect, useLayoutEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import ProBadge from '../components/ProBadge';
import FounderBadge from '../components/FounderBadge';
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
    isFounder?: boolean;
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

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const hasInitializedSelectionRef = useRef(false);
  
  // Helper to get conversation ID from URL (fallback if searchParams not ready)
  const getConversationIdFromUrl = () => {
    // Try searchParams first
    const fromSearchParams = searchParams.get('conversation');
    if (fromSearchParams) {
      return fromSearchParams;
    }
    
    // Fallback: read directly from window.location
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('conversation');
    }
    
    return null;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  // Watch for conversation ID in URL and select it when conversations are loaded
  useEffect(() => {
    const conversationId = getConversationIdFromUrl();
    
    if (conversationId && conversations.length > 0) {
      const conversationToSelect = conversations.find(
        (conv: Conversation) => conv.id === conversationId
      );
      
      if (conversationToSelect && selectedConversation?.id !== conversationId) {
        setSelectedConversation(conversationToSelect);
        // Clear URL after selection
        setTimeout(() => {
          router.replace('/messages');
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams]);


  const refreshConversations = async (preserveSelectionId?: string) => {
    try {
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
        
        // Only clear selection if the conversation disappeared
        if (preserveSelectionId) {
          const stillExists = data.conversations?.some(
            (conv: Conversation) => conv.id === preserveSelectionId
          );
          if (!stillExists) {
            setSelectedConversation(null);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Refresh conversations to update unread counts, but preserve selection
      refreshConversations(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!selectedConversation || !userId) return;

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Only add the message if it's not already in the list
          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg.id === newMessage.id);
            if (messageExists) return prev;
            
            // Check if this is a message from the current user that matches an optimistic update
            // If so, replace the optimistic message instead of adding a duplicate
            if (newMessage.sender_id === userId) {
              const optimisticIndex = prev.findIndex(
                (msg) => msg.id.startsWith('temp-') && 
                         msg.content === newMessage.content &&
                         msg.sender_id === newMessage.sender_id
              );
              
              if (optimisticIndex !== -1) {
                // Replace optimistic message with real one
                const updated = [...prev];
                updated[optimisticIndex] = newMessage;
                return updated;
              }
            }
            
            // Add the new message
            return [...prev, newMessage];
          });
          
          // Update conversations list to show new last message
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === selectedConversation.id
                ? {
                    ...conv,
                    lastMessage: {
                      content: newMessage.content,
                      created_at: newMessage.created_at,
                    },
                  }
                : conv
            )
          );
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or conversation change
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, userId]);

  const isScrollable = (el: HTMLElement) => el.scrollHeight > el.clientHeight;

  // Scroll to bottom when messages finish loading or count changes
  useEffect(() => {
    const el = messagesEndRef.current?.parentElement;
    if (!el) return;
    if (messagesLoading) return;
    if (!messages.length) return;

    // If not scrollable yet, wait one frame
    if (!isScrollable(el)) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      });
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messagesLoading, messages.length]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    setUserId(session.user.id);
    // Get current user's avatar
    const avatarUrl = session.user.user_metadata?.avatar_url || 
                     session.user.user_metadata?.picture || null;
    setUserAvatar(avatarUrl);
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
        const conversationsList = data.conversations || [];
        setConversations(conversationsList);
        
        // Select conversation from URL (ONLY place selection happens)
        const conversationId = getConversationIdFromUrl();
        
        // If there's a conversation ID in URL, we need to select it
        if (conversationId) {
          const conversationToSelect = conversationsList.find(
            (conv: Conversation) => conv.id === conversationId
          );
          
          // If URL has conversation ID and it's different from selected, or nothing is selected
          if (conversationToSelect && selectedConversation?.id !== conversationId) {
            setSelectedConversation(conversationToSelect);
            hasInitializedSelectionRef.current = true;
            // Clear URL after a delay to ensure selection is set
            setTimeout(() => {
              router.replace('/messages');
            }, 200);
          } else if (!conversationToSelect && !selectedConversation && retryCountRef.current < 3) {
            // Conversation ID in URL but not found - might be a new conversation
            // Retry if user hasn't manually selected a conversation
            retryCountRef.current += 1;
            setTimeout(() => {
              fetchConversations();
            }, retryCountRef.current * 300);
            setLoading(false);
            return;
          } else if (!conversationToSelect && retryCountRef.current >= 3) {
            // After retries, give up
            console.warn('Conversation not found after retries:', conversationId);
            retryCountRef.current = 0;
            hasInitializedSelectionRef.current = true;
            // Only clear URL if we're not still waiting for the conversation
            setTimeout(() => {
              router.replace('/messages');
            }, 200);
          } else if (conversationToSelect && selectedConversation?.id === conversationId) {
            // Already selected correctly, just mark as initialized
            hasInitializedSelectionRef.current = true;
            // Clear URL after a delay
            setTimeout(() => {
              router.replace('/messages');
            }, 200);
          }
        } else if (!hasInitializedSelectionRef.current) {
          // No conversation ID in URL and not initialized - mark as initialized
          hasInitializedSelectionRef.current = true;
        }
      }
    } catch (error) {
      console.error('[Messages] Error fetching conversations:', error);
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

  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent any scroll behavior
    const scrollY = window.scrollY;
    
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const messageToSend = newMessage.trim();
    // Optimistically clear the input first
    setNewMessage('');
    
    // Optimistically add message to UI (we'll replace with server response)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: userId || '',
      content: messageToSend,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Revert optimistic update on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        setNewMessage(messageToSend);
        return;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          content: messageToSend,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newMessageData = data.message;
        
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? newMessageData : m));
        
        // Update conversations list optimistically without full refetch
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  content: newMessageData.content,
                  created_at: newMessageData.created_at,
                },
              }
            : conv
        ));
      } else {
        // Revert optimistic update on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        setNewMessage(messageToSend);
        const error = await response.json();
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      // Revert optimistic update on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageToSend);
      console.error('Error sending message:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSending(false);
      // Restore scroll position to prevent page scroll
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
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
                        {conv.otherUser.isFounder ? <FounderBadge size={16} /> : conv.otherUser.isPro && <ProBadge size={16} />}
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
                        {selectedConversation.otherUser.isFounder ? <FounderBadge size={14} /> : selectedConversation.otherUser.isPro && <ProBadge size={14} />}
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
                      messages.map((message) => {
                        const isSent = message.sender_id === userId;
                        const avatar = isSent 
                          ? userAvatar 
                          : selectedConversation?.otherUser.avatar || null;
                        const name = isSent 
                          ? '' // Don't need name for sent messages
                          : selectedConversation?.otherUser.name || '';
                        
                        return (
                          <div
                            key={message.id}
                            className={`${styles.message} ${isSent ? styles.sent : styles.received}`}
                          >
                            {!isSent && (
                              <div className={styles.messageAvatar}>
                                {avatar ? (
                                  <Image
                                    src={avatar}
                                    alt={name || 'User'}
                                    width={28}
                                    height={28}
                                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className={styles.messageAvatarPlaceholder}>
                                    {name ? name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className={styles.messageContent}>
                              <p>{message.content}</p>
                              <span className={styles.messageTime}>
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSendMessage(e);
                    }}
                    className={styles.messageInput}
                  >
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      maxLength={1000}
                      className={styles.messageTextarea}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={styles.sendButton}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
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

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  );
}
