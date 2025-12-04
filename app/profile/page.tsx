'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const normalizeUrl = (url: string): string => {
    if (!url || !url.trim()) return '';
    const trimmed = url.trim();
    // If URL doesn't start with http:// or https://, add https://
    if (!trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`;
    }
    return trimmed;
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

  const userName = user.user_metadata?.full_name || 
                  user.user_metadata?.name || 
                  user.email?.split('@')[0] || 
                  'User';
  
  const userHandle = user.email ? `@${user.email.split('@')[0]}` : '@user';
  const userAvatar = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || null;
  
  // Get user initials for avatar
  let userInitials = 'U';
  if (userName && userName !== user.email?.split('@')[0]) {
    const nameParts = userName.split(' ');
    userInitials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : nameParts[0][0].toUpperCase();
  } else if (user.email) {
    userInitials = user.email[0].toUpperCase();
  }

  const joinDate = formatJoinDate(user.created_at);
  const portfolioUrl = user.user_metadata?.portfolio_url || '';
  
  // Display portfolio URL without protocol prefix in the input
  const displayPortfolioUrl = portfolioUrl ? portfolioUrl.replace(/^https?:\/\//i, '') : '';

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
    setError(null);
    setSuccess(false);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setError(null);
    setSuccess(false);
  };

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const portfolioUrlInput = formData.get('portfolioUrl') as string;
      const fileInput = formData.get('profilePicture') as File | null;

      // Normalize portfolio URL (add https:// if missing)
      const normalizedPortfolioUrl = portfolioUrlInput && portfolioUrlInput.trim()
        ? normalizeUrl(portfolioUrlInput.trim())
        : null;

      let avatarUrl: string | null = null;
      let shouldUpdateAvatar = false;

      // Upload profile picture if provided
      if (fileInput && fileInput.size > 0) {
        shouldUpdateAvatar = true;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          throw new Error('Not authenticated');
        }

        // Generate unique filename
        const fileExt = fileInput.name.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload directly to Supabase Storage from client
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, fileInput, {
            contentType: fileInput.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          
          // Provide helpful error messages
          let errorMessage = 'Failed to upload image';
          if (uploadError.message.includes('The resource already exists')) {
            errorMessage = 'An image with this name already exists. Please try again.';
          } else if (uploadError.message.includes('new row violates row-level security') || uploadError.message.includes('permission denied')) {
            errorMessage = 'Permission denied. Please check storage bucket policies. Make sure the "profile-images" bucket exists and has proper policies set up.';
          } else if (uploadError.message.includes('Bucket not found')) {
            errorMessage = 'Storage bucket not found. Please create "profile-images" bucket in Supabase Storage.';
          } else {
            errorMessage = uploadError.message || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get image URL');
        }

        avatarUrl = urlData.publicUrl;
      }

      // Update profile using client-side Supabase (more reliable for metadata updates)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        throw new Error('Not authenticated');
      }

      // Get current user metadata
      const currentMetadata = session.user.user_metadata || {};
      
      // Prepare updated metadata
      const updatedMetadata = { ...currentMetadata };
      
      if (shouldUpdateAvatar) {
        updatedMetadata.avatar_url = avatarUrl;
        updatedMetadata.picture = avatarUrl; // Also update picture field for consistency
      }
      
      if (normalizedPortfolioUrl !== undefined) {
        updatedMetadata.portfolio_url = normalizedPortfolioUrl;
      }

      console.log('Updating user metadata:', {
        hasAvatar: shouldUpdateAvatar,
        portfolioUrl: normalizedPortfolioUrl,
        metadata: updatedMetadata
      });

      // Update user metadata directly using client-side Supabase
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      console.log('Profile updated successfully:', updateData);

      setSuccess(true);
      
      // Refresh user data to show updated profile
      await refreshUser();
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.profile} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Profile</h2>
          </ScrollAnimation>

          <div className={styles.profileContent}>
            {/* Profile Header */}
            <ScrollAnimation>
              <div className={styles.profileHeader}>
                <div className={styles.avatarContainer}>
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
                </div>
                <div className={styles.profileInfo}>
                  <div className={styles.profileHeaderTop}>
                    <div>
                      <h3 className={styles.userName}>{userName}</h3>
                      <p className={styles.userMeta}>
                        {userName} • Joined {joinDate}
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
                    <button 
                      onClick={handleEditProfile}
                      className={styles.editButton}
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

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
                        <div className={styles.postAvatar}>{post.user_avatar || userInitials}</div>
                        <div className={styles.postContent}>
                          <div className={styles.postHeader}>
                            <span className={styles.postName}>{post.user_name || userName}</span>
                            <span className={styles.postHandle}>{post.user_handle || userHandle}</span>
                            <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                          </div>
                          <p className={styles.postText}>{post.content}</p>
                          <p className={styles.postDate}>{formatDate(post.created_at)}</p>
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

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile</h3>
              <button 
                className={styles.modalClose}
                onClick={handleCloseModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="profilePicture" className={styles.formLabel}>
                  Profile Picture
                </label>
                <input
                  id="profilePicture"
                  name="profilePicture"
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                />
                <p className={styles.fileHint}>
                  Upload a new profile picture (max 5MB)
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="modalPortfolioUrl" className={styles.formLabel}>
                  Portfolio/Website URL
                </label>
                <input
                  id="modalPortfolioUrl"
                  name="portfolioUrl"
                  type="text"
                  placeholder="yourportfolio.com"
                  defaultValue={displayPortfolioUrl}
                  className={styles.formInput}
                />
                <p className={styles.fileHint}>
                  Enter URL without http:// or https:// (will be added automatically)
                </p>
              </div>

              {error && (
                <div className={styles.errorMessage}>{error}</div>
              )}

              {success && (
                <div className={styles.successMessage}>Profile updated successfully!</div>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelButton}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

