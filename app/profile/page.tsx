'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import ArtworkUploader from '../components/ArtworkUploader';
import styles from '../styles/Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'posts' | 'artwork' | 'commissions' | 'meetups'>('profile');
  const [userCommissions, setUserCommissions] = useState<any[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [userArtwork, setUserArtwork] = useState<any[]>([]);
  const [artworkLoading, setArtworkLoading] = useState(true);
  const [galleryImageId, setGalleryImageId] = useState<string | null>(null);
  const [userMeetups, setUserMeetups] = useState<any[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(true);

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
        const galleryImageId = session.user.user_metadata?.gallery_image_id || null;
        setGalleryImageId(galleryImageId);
        await fetchUserPosts(session.user.id);
        await fetchUserCommissions(session.user.id);
        await fetchUserArtwork(session.user.id);
        await fetchUserMeetups(session.user.id);
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

  const fetchUserCommissions = async (userId: string) => {
    try {
      setCommissionsLoading(true);
      const response = await fetch('/api/commissions');
      if (response.ok) {
        const data = await response.json();
        // Filter commissions to only show current user's commissions
        const myCommissions = (data.commissions || []).filter((commission: any) => commission.user_id === userId);
        setUserCommissions(myCommissions);
      }
    } catch (error) {
      console.error('Error fetching user commissions:', error);
    } finally {
      setCommissionsLoading(false);
    }
  };

  const fetchUserArtwork = async (userId: string) => {
    try {
      setArtworkLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/artwork?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserArtwork(data.artwork || []);
      }
    } catch (error) {
      console.error('Error fetching user artwork:', error);
    } finally {
      setArtworkLoading(false);
    }
  };

  const fetchUserMeetups = async (userId: string) => {
    try {
      setMeetupsLoading(true);
      const response = await fetch('/api/meetups');
      if (response.ok) {
        const data = await response.json();
        // Filter meetups to only show current user's meetups (host)
        const myMeetups = (data.meetups || []).filter((meetup: any) => meetup.host_id === userId);
        setUserMeetups(myMeetups);
      }
    } catch (error) {
      console.error('Error fetching user meetups:', error);
    } finally {
      setMeetupsLoading(false);
    }
  };

  const handleGalleryImageChange = async (artworkId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        alert('You must be logged in to set a gallery image.');
        return;
      }

      // Verify the artwork belongs to the user
      const { data: artwork, error: artworkError } = await supabase
        .from('artwork')
        .select('id, user_id')
        .eq('id', artworkId)
        .eq('user_id', session.user.id)
        .single();

      if (artworkError || !artwork) {
        alert('Artwork not found or you do not have permission to set it as gallery image');
        return;
      }

      // Update user metadata directly using client-side Supabase (more reliable)
      const currentMetadata = session.user.user_metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        gallery_image_id: artworkId,
      };

      const { error: updateError } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (updateError) {
        console.error('Error updating gallery image:', updateError);
        alert(updateError.message || 'Failed to set gallery image');
        return;
      }

      // Update local state
      setGalleryImageId(artworkId);
      
      // Refresh user data to get updated metadata
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession?.user) {
        setUser(newSession.user);
      }
    } catch (error) {
      console.error('Error setting gallery image:', error);
      alert('An error occurred. Please try again.');
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

  const handleDeleteCommission = async (commissionId: string) => {
    if (!confirm('Are you sure you want to delete this commission?')) {
      return;
    }

    try {
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('You must be logged in to delete a commission.');
        return;
      }

      const response = await fetch(`/api/commissions?id=${commissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete commission');
      } else {
        // Remove the commission from the local state
        setUserCommissions(userCommissions.filter((commission: any) => commission.id !== commissionId));
      }
    } catch (error: any) {
      console.error('Error deleting commission:', error);
      alert(error.message || 'Failed to delete commission. Please try again.');
    }
  };

  const handleDeleteMeetup = async (meetupId: string) => {
    if (!confirm('Are you sure you want to delete this meetup?')) {
      return;
    }

    try {
      // Use Supabase client directly for deletion (RLS will handle permissions)
      const { error } = await supabase
        .from('meetups')
        .delete()
        .eq('id', meetupId);

      if (error) {
        console.error('Error deleting meetup:', error);
        alert(error.message || 'Failed to delete meetup');
      } else {
        // Remove the meetup from the local state
        setUserMeetups(userMeetups.filter((meetup: any) => meetup.id !== meetupId));
      }
    } catch (error) {
      console.error('Error deleting meetup:', error);
      alert('Failed to delete meetup. Please try again.');
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
  const favoriteMediums = user.user_metadata?.favorite_mediums || [];
  const city = user.user_metadata?.city || '';
  const state = user.user_metadata?.state || '';
  const cityPublic = user.user_metadata?.city_public !== false;
  const statePublic = user.user_metadata?.state_public !== false;

  // Create slug for artist page
  const createSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const userHandleForSlug = user.user_metadata?.handle || null;
  const artistSlug = userHandleForSlug 
    ? userHandleForSlug.replace('@', '').toLowerCase()
    : createSlug(displayName);

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
                      {discipline && (
                        <p className={styles.userMeta}>{discipline}</p>
                      )}
                      <p className={styles.userMeta}>
                        {(() => {
                          const locationParts: string[] = [];
                          if (city && cityPublic) locationParts.push(city);
                          if (state && statePublic) locationParts.push(state);
                          const location = locationParts.length > 0 ? locationParts.join(', ') : null;
                          return location ? `${location} • Joined ${joinDate}` : `Joined ${joinDate}`;
                        })()}
                      </p>
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

            {/* Combined Profile Box: Nav, Bio, Favorite Mediums, or Posts */}
            <ScrollAnimation>
              <div className={styles.profileBox}>
                {/* Tab Navigation */}
                <div className={styles.tabNavigation}>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'profile' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profile
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'artwork' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('artwork')}
                  >
                    Artwork
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'posts' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('posts')}
                  >
                    Posts
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'commissions' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('commissions')}
                  >
                    Commissions
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'meetups' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('meetups')}
                  >
                    Meetups
                  </button>
                </div>

                {/* Profile Tab Content */}
                {activeTab === 'profile' && (
                  <>
                    {/* Bio Section */}
                    {(bio || portfolioUrl) && (
                      <div className={styles.bioSection}>
                        <h4 className={styles.bioTitle}>Bio</h4>
                        {bio && (
                          <p className={styles.bioText}>{bio}</p>
                        )}
                        {portfolioUrl && (
                          <a 
                            href={portfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.portfolioLink}
                            style={{ 
                              display: 'inline-block', 
                              marginTop: bio ? '16px' : '0',
                              color: 'var(--accent-color)',
                              textDecoration: 'none',
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.95rem',
                              fontWeight: 500
                            }}
                          >
                            {portfolioUrl.replace(/^https?:\/\//i, '')}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Favorite Mediums Section */}
                    {favoriteMediums && Array.isArray(favoriteMediums) && favoriteMediums.length > 0 && (
                      <div className={styles.mediumsSection}>
                        <h4 className={styles.mediumsTitle}>Favorite Mediums</h4>
                        <div className={styles.mediumsList}>
                          {favoriteMediums.map((medium: string, index: number) => (
                            <span key={index} className={styles.mediumTag}>
                              {medium}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Posts Tab Content */}
                {activeTab === 'posts' && (
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
                )}

                {/* Artwork Tab Content */}
                {activeTab === 'artwork' && (
                  <div className={styles.artworkSection}>
                    <div className={styles.artworkHeader}>
                      <h4 className={styles.artworkTitle}>Artwork ({userArtwork.length})</h4>
                      <ArtworkUploader
                        onUploadSuccess={() => {
                          if (user?.id) {
                            fetchUserArtwork(user.id);
                          }
                        }}
                        artworkCount={userArtwork.length}
                      />
                    </div>
                    {artworkLoading ? (
                      <div className={styles.loading}>Loading artwork...</div>
                    ) : userArtwork.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No artwork uploaded yet.</p>
                      </div>
                    ) : (
                      <div className={styles.artworkGrid}>
                        {userArtwork.map((artwork: any) => (
                          <div key={artwork.id} className={styles.artworkItemWrapper}>
                            <div className={styles.galleryImageSelector}>
                              <label className={styles.radioLabel}>
                                <input
                                  type="radio"
                                  name="galleryImage"
                                  checked={galleryImageId === artwork.id}
                                  onChange={() => handleGalleryImageChange(artwork.id)}
                                  className={styles.radioInput}
                                />
                                <span>Gallery Image</span>
                              </label>
                            </div>
                            <Link
                              href={`/artist/${artistSlug}`}
                              className={styles.artworkItemLink}
                            >
                              <div className={styles.artworkItem}>
                                <Image
                                  src={artwork.image_url}
                                  alt={artwork.title || 'Artwork'}
                                  width={300}
                                  height={300}
                                  className={styles.artworkImage}
                                />
                                {artwork.title && (
                                  <p className={styles.artworkItemTitle}>{artwork.title}</p>
                                )}
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Commissions Tab Content */}
                {activeTab === 'commissions' && (
                  <div className={styles.postsSection}>
                    <h4 className={styles.postsTitle}>My Commissions ({userCommissions.length})</h4>
                    
                    {commissionsLoading ? (
                      <div className={styles.loading}>Loading commissions...</div>
                    ) : userCommissions.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No commissions posted yet.</p>
                        <Link
                          href="/commissions/post-job"
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
                            marginTop: '16px',
                            display: 'inline-block',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e55a1a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ff6622';
                          }}
                        >
                          POST A JOB
                        </Link>
                      </div>
                    ) : (
                      <div className={styles.postsList}>
                        {userCommissions.map((commission: any) => (
                          <div key={commission.id} className={styles.post}>
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
                            <div className={styles.postContent}>
                              <div className={styles.postHeader}>
                                <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                                  <span className={styles.postName}>{commission.title}</span>
                                </Link>
                                <span className={styles.postHandle}>{commission.category || ''}</span>
                                <span className={styles.postTime}>{formatTimeAgo(commission.created_at)}</span>
                              </div>
                              <p className={styles.postText}>{commission.description}</p>
                              {(commission.category || commission.type || commission.budget_min) && (
                                <div style={{ 
                                  marginTop: '8px', 
                                  marginBottom: '8px',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-light)',
                                  fontFamily: 'var(--font-inter)',
                                }}>
                                  {commission.category && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <strong>Category:</strong> {commission.category}
                                    </div>
                                  )}
                                  {commission.type && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <strong>Type:</strong> {commission.type}
                                    </div>
                                  )}
                                  {commission.budget_min && commission.budget_max && (
                                    <div>
                                      <strong>Budget:</strong> ${commission.budget_min?.toLocaleString()} - ${commission.budget_max?.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className={styles.postFooter}>
                                <p className={styles.postDate}>{formatDate(commission.created_at)}</p>
                                <button
                                  onClick={() => handleDeleteCommission(commission.id)}
                                  className={styles.deleteButton}
                                  title="Delete commission"
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
                )}

                {/* Meetups Tab Content */}
                {activeTab === 'meetups' && (
                  <div className={styles.postsSection}>
                    <h4 className={styles.postsTitle}>My Meetups ({userMeetups.length})</h4>
                    
                    {meetupsLoading ? (
                      <div className={styles.loading}>Loading meetups...</div>
                    ) : userMeetups.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>You haven't hosted any meetups yet.</p>
                        <a href="/community" className={styles.linkToCommunity}>
                          Go to Community →
                        </a>
                      </div>
                    ) : (
                      <div className={styles.postsList}>
                        {userMeetups.map((meetup: any) => {
                          const eventDate = new Date(meetup.event_time);
                          const formattedDate = eventDate.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const formattedTime = eventDate.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          });
                          
                          return (
                            <div key={meetup.id} className={styles.post}>
                              <div className={styles.postContent} style={{ width: '100%' }}>
                                <div className={styles.postHeader}>
                                  <span className={styles.postName}>{meetup.title}</span>
                                  <span className={styles.postTime}>{formatTimeAgo(meetup.created_at)}</span>
                                </div>
                                <p className={styles.postText}>{meetup.description}</p>
                                <div style={{ 
                                  marginTop: '8px', 
                                  marginBottom: '8px',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-light)',
                                  fontFamily: 'var(--font-inter)',
                                }}>
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Date & Time:</strong> {formattedDate} at {formattedTime}
                                  </div>
                                  <div>
                                    <strong>Location:</strong> {meetup.location}
                                  </div>
                                </div>
                                <div className={styles.postFooter}>
                                  <p className={styles.postDate}>{formatDate(meetup.created_at)}</p>
                                  <button
                                    onClick={() => handleDeleteMeetup(meetup.id)}
                                    className={styles.deleteButton}
                                    title="Delete meetup"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

