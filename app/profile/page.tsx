'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session || !session.user) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        setLoading(false);
        await fetchUserPosts(session.user.id);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };

    checkAuthAndLoadProfile();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const fetchUserPosts = async (userId: string) => {
    try {
      setPostsLoading(true);
      const response = await fetch('/api/posts');
      if (response.ok) {
        const data = await response.json();
        // Filter posts to only show current user's posts
        const myPosts = (data.posts || []).filter((post: any) => post.user_id === userId);
        setUserPosts(myPosts);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      // Use Supabase client directly for deletion (RLS will handle permissions)
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        alert(error.message || 'Failed to delete post');
      } else {
        // Remove the post from the local state
        setUserPosts(userPosts.filter((post: any) => post.id !== postId));
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.display_name || null;
  const userName = displayName || 
                  user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email?.split('@')[0] || 
                  'User';
  
  const userHandle = user.user_metadata?.handle || 
                     (user.email ? `@${user.email.split('@')[0]}` : '@user');
  const userAvatar = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || null;
  
  // Get user initials for avatar - use display name if available
  let userInitials = 'U';
  const nameForInitials = displayName || userName;
  if (nameForInitials && nameForInitials !== user.email?.split('@')[0]) {
    const nameParts = nameForInitials.split(' ');
    userInitials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : nameParts[0][0].toUpperCase();
  } else if (user.email) {
    userInitials = user.email[0].toUpperCase();
  }

  const joinDate = formatJoinDate(user.created_at);
  const portfolioUrl = user.user_metadata?.portfolio_url || '';
  const bio = user.user_metadata?.bio || '';
  const discipline = user.user_metadata?.discipline || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.profile} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <div className={styles.profileContent}>
            {/* Profile Header */}
            <ScrollAnimation>
              <div className={styles.profileHeader}>
                <Link href="/profile" className={styles.avatarContainer} style={{ textDecoration: 'none' }}>
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt={userName}
                      width={150}
                      height={150}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <span>{userInitials}</span>
                    </div>
                  )}
                </Link>
                <div className={styles.profileInfo}>
                  <div className={styles.profileHeaderTop}>
                    <div>
                      <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className={styles.userName}>{userName}</h3>
                      </Link>
                      <p className={styles.userHandle}>{userHandle}</p>
                      <p className={styles.userMeta}>
                        {discipline || `Joined ${joinDate}`}
                      </p>
                      {portfolioUrl && (
                        <a 
                          href={portfolioUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.portfolioLink}
                        >
                          {portfolioUrl.replace(/^https?:\/\//i, '')}
                        </a>
                      )}
                    </div>
                    <Link 
                      href="/profile/edit"
                      className={styles.editButton}
                      style={{ textDecoration: 'none', display: 'inline-block' }}
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Bio Section */}
            {bio && (
              <ScrollAnimation>
                <div className={styles.bioSection}>
                  <h4 className={styles.bioTitle}>Bio</h4>
                  <p className={styles.bioText}>{bio}</p>
                </div>
              </ScrollAnimation>
            )}

            {/* User Posts Section */}
            <ScrollAnimation>
              <div className={styles.postsSection}>
                <h4 className={styles.postsTitle}>My Posts ({userPosts.length})</h4>
                
                {postsLoading ? (
                  <div className={styles.loading}>Loading posts...</div>
                ) : userPosts.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>You haven't posted anything yet.</p>
                    <a href="/community" className={styles.linkToCommunity}>
                      Go to Community →
                    </a>
                  </div>
                ) : (
                  <div className={styles.postsList}>
                    {userPosts.map((post) => (
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
                            <div className={styles.postAvatar}>{post.user_avatar || userInitials}</div>
                          )}
                        </Link>
                        <div className={styles.postContent}>
                          <div className={styles.postHeader}>
                            <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                              <span className={styles.postName}>{post.user_name || userName}</span>
                            </Link>
                            <span className={styles.postHandle}>{post.user_handle || userHandle}</span>
                            <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                          </div>
                          <p className={styles.postText}>{post.content}</p>
                          <div className={styles.postFooter}>
                            <p className={styles.postDate}>{formatDate(post.created_at)}</p>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className={styles.deleteButton}
                              title="Delete post"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

