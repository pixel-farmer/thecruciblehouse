'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Community.module.css';

export default function CommunityPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaidMembership, setHasPaidMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [userInitials, setUserInitials] = useState('U');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userHandle, setUserHandle] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    // Check authentication and membership status
    const checkMembership = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        if (session) {
          setUserId(session.user.id);
          
          // Get avatar URL from user metadata
          const avatarUrl = session.user.user_metadata?.avatar_url || 
                           session.user.user_metadata?.picture || null;
          setUserAvatar(avatarUrl);
          
          // Get user information for composer - prioritize display_name
          const email = session.user.email || '';
          const displayName = session.user.user_metadata?.display_name;
          const name = displayName || 
                      session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name || '';
          
          if (name) {
            setUserName(name);
            const nameParts = name.split(' ');
            setUserInitials(
              nameParts.length >= 2 
                ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
                : nameParts[0][0].toUpperCase()
            );
          } else if (email) {
            setUserName(email.split('@')[0]);
            setUserInitials(email[0].toUpperCase());
          }
          
          // Use custom handle from metadata, or generate from email
          const customHandle = session.user.user_metadata?.handle;
          if (customHandle) {
            setUserHandle(customHandle);
          } else if (email) {
            const handle = email.split('@')[0];
            setUserHandle(`@${handle}`);
          }
          
          // Check if user has paid membership
          // For now, we'll check user metadata or you can implement a separate check
          // This is a placeholder - you'll need to implement actual membership checking
          const userMetadata = session.user.user_metadata;
          const membershipStatus = userMetadata?.membership_status || userMetadata?.has_paid_membership;
          
          // If you have a membership field in user metadata, check it
          // Otherwise, you can query a separate memberships table
          setHasPaidMembership(!!membershipStatus);
        } else {
          setHasPaidMembership(false);
          setUserInitials('U');
          setUserAvatar(null);
          setUserName('');
          setUserHandle('');
          setUserId(null);
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setHasPaidMembership(false);
      } finally {
        setLoading(false);
      }
    };

    checkMembership();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        setUserId(session.user.id);
        
        // Get avatar URL from user metadata
        const avatarUrl = session.user.user_metadata?.avatar_url || 
                         session.user.user_metadata?.picture || null;
        setUserAvatar(avatarUrl);
        
        // Update user info - prioritize display_name
        const email = session.user.email || '';
        const displayName = session.user.user_metadata?.display_name;
        const name = displayName || 
                    session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || '';
        
        if (name) {
          setUserName(name);
          const nameParts = name.split(' ');
          setUserInitials(
            nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : nameParts[0][0].toUpperCase()
          );
        } else if (email) {
          setUserName(email.split('@')[0]);
          setUserInitials(email[0].toUpperCase());
        }
        
        // Use custom handle from metadata, or generate from email
        const customHandle = session.user.user_metadata?.handle;
        if (customHandle) {
          setUserHandle(customHandle);
        } else if (email) {
          const handle = email.split('@')[0];
          setUserHandle(`@${handle}`);
        }
        
        const userMetadata = session.user.user_metadata;
        const membershipStatus = userMetadata?.membership_status || userMetadata?.has_paid_membership;
        setHasPaidMembership(!!membershipStatus);
      } else {
        setHasPaidMembership(false);
        setUserInitials('U');
        setUserName('');
        setUserHandle('');
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch posts on load
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await fetch('/api/posts');
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        // Get the error details from the response
        let errorData: any = {};
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { 
              error: text || `HTTP ${response.status}: ${response.statusText}`,
              rawResponse: text 
            };
          }
        } catch (parseError) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          };
        }
        
        console.error('Failed to fetch posts:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          error: errorData,
        });
        
        // Also log the error details separately for easier debugging
        if (errorData?.error) {
          console.error('Error message:', errorData.error);
        }
        if (errorData?.details) {
          console.error('Error details:', errorData.details);
        }
        if (errorData?.code) {
          console.error('Error code:', errorData.code);
        }
        
        // Show empty state - error is logged but won't break the UI
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts (network/exception):', error);
      // Show empty state - error is logged but won't break the UI
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() || !userId || isPosting) return;

    try {
      setIsPosting(true);
      
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('You must be logged in to post.');
        setIsPosting(false);
        return;
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: postText.trim(),
          userName,
          userHandle,
          userAvatar: userAvatar || userInitials,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new post to the beginning of the posts array
        setPosts([data.post, ...posts]);
        setPostText('');
        // Refresh posts to ensure we have the latest
        await fetchPosts();
      } else {
        const error = await response.json();
        console.error('Failed to create post:', error);
        alert('Failed to post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.community} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Community</h2>
          </ScrollAnimation>

          <div className={styles.communityGrid}>
            {/* Column 1: Recently Active Members / Groups */}
            <div className={styles.column}>
              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Recently Active Members</h3>
                  <div className={styles.memberList}>
                    <div className={styles.memberItem}>
                      <div className={styles.memberAvatar}>JD</div>
                      <div className={styles.memberInfo}>
                        <p className={styles.memberName}>John Doe</p>
                        <p className={styles.memberActivity}>Active 2 hours ago</p>
                      </div>
                    </div>
                    <div className={styles.memberItem}>
                      <div className={styles.memberAvatar}>JS</div>
                      <div className={styles.memberInfo}>
                        <p className={styles.memberName}>Jane Smith</p>
                        <p className={styles.memberActivity}>Active 5 hours ago</p>
                      </div>
                    </div>
                    <div className={styles.memberItem}>
                      <div className={styles.memberAvatar}>AB</div>
                      <div className={styles.memberInfo}>
                        <p className={styles.memberName}>Alex Brown</p>
                        <p className={styles.memberActivity}>Active 1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Groups</h3>
                  <div className={styles.groupList}>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Digital Artists Collective</h5>
                      <p className={styles.groupMembers}>245 members</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Traditional Techniques</h5>
                      <p className={styles.groupMembers}>189 members</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Business & Marketing</h5>
                      <p className={styles.groupMembers}>312 members</p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>

            {/* Column 2: Community Feed */}
            <ScrollAnimation>
              <div className={styles.column}>
                <div className={styles.postFeed}>
                  {/* Post Composer */}
                  <div className={styles.postComposer}>
                    <Link href="/profile" style={{ textDecoration: 'none' }}>
                      {userAvatar && userAvatar.startsWith('http') ? (
                        <div className={styles.postAvatarImage}>
                          <Image
                            src={userAvatar}
                            alt="Profile"
                            width={48}
                            height={48}
                            className={styles.postAvatarImg}
                          />
                        </div>
                      ) : (
                        <div className={styles.postAvatar}>{userInitials}</div>
                      )}
                    </Link>
                    <div className={styles.composerContent}>
                      <textarea
                        className={styles.composerTextarea}
                        placeholder="What's happening?"
                        rows={3}
                        value={postText}
                        onChange={(e) => setPostText(e.target.value)}
                        maxLength={300}
                      />
                      <div className={styles.composerActions}>
                        <div className={styles.composerIcons}>
                          {/* Icons can be added here later (image, etc.) */}
                        </div>
                        <div className={styles.composerRight}>
                          {postText.length > 0 && (
                            <span className={styles.characterCount}>
                              {300 - postText.length}
                            </span>
                          )}
                          <button 
                            className={styles.postButton}
                            disabled={postText.trim().length === 0 || isPosting || !isLoggedIn}
                            onClick={handlePostSubmit}
                          >
                            {isPosting ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {postsLoading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                      Loading posts...
                    </div>
                  ) : posts.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                      No posts yet. Be the first to post!
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div key={post.id} className={styles.post}>
                        <Link href="/profile" style={{ textDecoration: 'none' }}>
                          {post.user_avatar && post.user_avatar.startsWith('http') ? (
                            <div className={styles.postAvatarImage}>
                              <Image
                                src={post.user_avatar}
                                alt="Profile"
                                width={48}
                                height={48}
                                className={styles.postAvatarImg}
                              />
                            </div>
                          ) : (
                            <div className={styles.postAvatar}>{post.user_avatar || 'U'}</div>
                          )}
                        </Link>
                        <div className={styles.postContent}>
                          <div className={styles.postHeader}>
                            <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                              <span className={styles.postName}>{post.user_name || 'User'}</span>
                            </Link>
                            <span className={styles.postHandle}>{post.user_handle || '@user'}</span>
                            <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                          </div>
                          <p className={styles.postText}>{post.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </ScrollAnimation>

            {/* Column 3: Artists Near Me / Meetups */}
            <div className={styles.column}>
              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Artists Near Me</h3>
                  
                  {hasPaidMembership ? (
                    <div className={styles.nearbyList}>
                      <div className={styles.nearbyItem}>
                        <div className={styles.nearbyAvatar}>MC</div>
                        <div className={styles.nearbyInfo}>
                          <p className={styles.nearbyName}>Mike Chen</p>
                          <p className={styles.nearbyDistance}>2.3 miles away</p>
                        </div>
                      </div>
                      <div className={styles.nearbyItem}>
                        <div className={styles.nearbyAvatar}>SL</div>
                        <div className={styles.nearbyInfo}>
                          <p className={styles.nearbyName}>Sarah Lee</p>
                          <p className={styles.nearbyDistance}>4.7 miles away</p>
                        </div>
                      </div>
                      <div className={styles.nearbyItem}>
                        <div className={styles.nearbyAvatar}>RW</div>
                        <div className={styles.nearbyInfo}>
                          <p className={styles.nearbyName}>Robert White</p>
                          <p className={styles.nearbyDistance}>6.1 miles away</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                      <div style={{ 
                        width: '100%', 
                        aspectRatio: '1 / 1',
                        marginBottom: '1rem',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                        position: 'relative'
                      }}>
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1841336039!2d-74.00594138459418!3d40.71277597932672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a2976a1d5a9%3A0xc90f8fdffbcf390!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                        <button
                          onClick={() => setIsMapFullscreen(true)}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter)',
                            fontSize: '1.2rem',
                            color: 'var(--text-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            transition: 'all 0.2s ease',
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="View fullscreen map"
                        >
                          <span style={{ lineHeight: 1 }}>[ ]</span>
                        </button>
                      </div>
                      <p style={{ 
                        color: 'var(--text-light)', 
                        fontFamily: 'var(--font-inter)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                      }}>
                        Upgrade to a paid membership to see members near you and connect with local artists.
                      </p>
                      <button
                        className="inline-block focus:outline-none"
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontFamily: 'var(--font-inter)',
                          borderRadius: '20px',
                          backgroundColor: '#ff6622',
                          color: 'white',
                          outline: 'none',
                          border: 'none',
                          textDecoration: 'none',
                          transition: 'background-color 0.2s ease',
                          padding: '8px 20px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e55a1a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ff6622';
                        }}
                      >
                        UPGRADE
                      </button>
                    </div>
                  )}
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Workshops & Meetups</h3>
                  <div className={styles.eventList}>
                    <div className={styles.eventItem}>
                      <h5 className={styles.eventName}>Artist Coffee Hour</h5>
                      <p className={styles.eventDate}>March 15, 2025</p>
                      <p className={styles.eventLocation}>Local Café</p>
                    </div>
                    <div className={styles.eventItem}>
                      <h5 className={styles.eventName}>Creative Critique Session</h5>
                      <p className={styles.eventDate}>March 22, 2025</p>
                      <p className={styles.eventLocation}>Community Studio</p>
                    </div>
                    <div className={styles.eventItem}>
                      <h5 className={styles.eventName}>Portfolio Review</h5>
                      <p className={styles.eventDate}>March 28, 2025</p>
                      <p className={styles.eventLocation}>Gallery Space</p>
                    </div>
                  </div>
                  <button
                    className={styles.hostMeetupButton}
                    style={{
                      width: '100%',
                      padding: '8px 20px',
                      marginTop: '15px',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      borderRadius: '20px',
                      backgroundColor: '#ff6622',
                      color: 'white',
                      outline: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e55a1a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff6622';
                    }}
                  >
                    Host a Meetup
                  </button>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Nearby Exhibitions</h3>
                  <div className={styles.eventList}>
                    <div className={styles.eventItem}>
                      <h5 className={styles.eventName}>Portrait Workshop</h5>
                      <p className={styles.eventDate}>March 20, 2025</p>
                      <p className={styles.eventLocation}>Studio Downtown</p>
                    </div>
                    <div className={styles.eventItem}>
                      <h5 className={styles.eventName}>Digital Art Meetup</h5>
                      <p className={styles.eventDate}>March 25, 2025</p>
                      <p className={styles.eventLocation}>Community Center</p>
                    </div>
                    <div className={styles.eventItem}>
                      <h5 className={styles.eventName}>Business Networking</h5>
                      <p className={styles.eventDate}>April 1, 2025</p>
                      <p className={styles.eventLocation}>Art Gallery</p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Map Modal */}
      {isMapFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button
              onClick={() => setIsMapFullscreen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter)',
                fontSize: '1.3rem',
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                zIndex: 10000
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Exit fullscreen"
            >
              <span style={{ lineHeight: 1 }}>[X]</span>
            </button>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.1841336039!2d-74.00594138459418!3d40.71277597932672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a2976a1d5a9%3A0xc90f8fdffbcf390!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

