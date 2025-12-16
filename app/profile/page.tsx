'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import ArtworkUploader from '../components/ArtworkUploader';
import ProBadge from '../components/ProBadge';
import FounderBadge from '../components/FounderBadge';
import styles from '../styles/Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'artwork' | 'commissions' | 'meetups' | 'exhibits' | 'subscription'>('profile');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [userCommissions, setUserCommissions] = useState<any[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(true);
  const [userArtwork, setUserArtwork] = useState<any[]>([]);
  const [artworkLoading, setArtworkLoading] = useState(true);
  const [galleryImageId, setGalleryImageId] = useState<string | null>(null);
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMedium, setEditingMedium] = useState('');
  const [updatingArtwork, setUpdatingArtwork] = useState(false);
  const [userMeetups, setUserMeetups] = useState<any[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(true);
  const [userExhibitions, setUserExhibitions] = useState<any[]>([]);
  const [exhibitionsLoading, setExhibitionsLoading] = useState(true);

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
        await fetchUserCommissions(session.user.id);
        await fetchUserArtwork(session.user.id);
        await fetchUserMeetups(session.user.id);
        await fetchUserExhibitions(session.user.id);
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

  const fetchSubscriptionStatus = async () => {
    try {
      setSubscriptionLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/subscription/manage', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.')) {
      return;
    }

    setSubscriptionActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/subscription/manage', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        await fetchSubscriptionStatus();
        await refreshUser();
        alert('Your subscription will be cancelled at the end of your current billing period.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('An error occurred while cancelling your subscription');
    } finally {
      setSubscriptionActionLoading(false);
    }
  };

  const handlePauseSubscription = async () => {
    if (!confirm('Are you sure you want to pause your subscription? You will retain access until the end of your current billing period, then it will be paused.')) {
      return;
    }

    setSubscriptionActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/subscription/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'pause' }),
      });

      if (response.ok) {
        await fetchSubscriptionStatus();
        await refreshUser();
        alert('Your subscription will be paused at the end of your current billing period.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to pause subscription');
      }
    } catch (error) {
      console.error('Error pausing subscription:', error);
      alert('An error occurred while pausing your subscription');
    } finally {
      setSubscriptionActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setSubscriptionActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/subscription/manage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'resume' }),
      });

      if (response.ok) {
        await fetchSubscriptionStatus();
        await refreshUser();
        alert('Your subscription has been resumed.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to resume subscription');
      }
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('An error occurred while resuming your subscription');
    } finally {
      setSubscriptionActionLoading(false);
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

  const handleEditArtwork = (artwork: any) => {
    setEditingArtworkId(artwork.id);
    setEditingTitle(artwork.title || '');
    setEditingMedium(artwork.medium || '');
  };

  const handleCancelEdit = () => {
    setEditingArtworkId(null);
    setEditingTitle('');
    setEditingMedium('');
  };

  const handleUpdateArtwork = async (artworkId: string) => {
    try {
      setUpdatingArtwork(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/artwork/${artworkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: editingTitle.trim() || null,
          medium: editingMedium.trim() || null,
        }),
      });

      if (response.ok) {
        // Refresh artwork list
        if (user?.id) {
          await fetchUserArtwork(user.id);
        }
        handleCancelEdit();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update artwork');
      }
    } catch (error) {
      console.error('Error updating artwork:', error);
      alert('Failed to update artwork. Please try again.');
    } finally {
      setUpdatingArtwork(false);
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

  const fetchUserExhibitions = async (userId: string) => {
    try {
      setExhibitionsLoading(true);
      const response = await fetch('/api/exhibitions');
      if (response.ok) {
        const data = await response.json();
        // Filter exhibitions to only show current user's exhibitions (host)
        const myExhibitions = (data.exhibitions || []).filter((exhibition: any) => exhibition.host_id === userId);
        setUserExhibitions(myExhibitions);
      }
    } catch (error) {
      console.error('Error fetching user exhibitions:', error);
    } finally {
      setExhibitionsLoading(false);
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

  const handleDeleteExhibition = async (exhibitionId: string) => {
    if (!confirm('Are you sure you want to delete this exhibition?')) {
      return;
    }

    try {
      // Use Supabase client directly for deletion (RLS will handle permissions)
      const { error } = await supabase
        .from('exhibitions')
        .delete()
        .eq('id', exhibitionId);

      if (error) {
        console.error('Error deleting exhibition:', error);
        alert(error.message || 'Failed to delete exhibition');
      } else {
        // Remove the exhibition from the local state
        setUserExhibitions(userExhibitions.filter((exhibition: any) => exhibition.id !== exhibitionId));
      }
    } catch (error) {
      console.error('Error deleting exhibition:', error);
      alert('Failed to delete exhibition. Please try again.');
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
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting join date:', error);
      return '';
    }
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

  // Safe user data extraction with fallbacks
  const userMetadata = user.user_metadata || {};
  const displayName = userMetadata.display_name || null;
  const email = user.email || '';
  const emailPrefix = email ? email.split('@')[0] : '';
  const userName = displayName || 
                  userMetadata.full_name || 
                  userMetadata.name || 
                  emailPrefix || 
                  'User';
  
  const userHandle = userMetadata.handle || 
                     (email ? `@${emailPrefix}` : '@user');
  const userAvatar = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || null;
  
  // Get user initials for avatar - use display name if available
  let userInitials = 'U';
  const nameForInitials = displayName || userName;
  if (nameForInitials && nameForInitials !== emailPrefix) {
    const nameParts = nameForInitials.split(' ').filter((part: string) => part.length > 0);
    if (nameParts.length >= 2) {
      userInitials = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
      userInitials = nameParts[0][0].toUpperCase();
    }
  } else if (user.email && user.email.length > 0) {
    userInitials = user.email[0].toUpperCase();
  }

  const joinDate = user.created_at ? formatJoinDate(user.created_at) : '';
  const portfolioUrl = user.user_metadata?.portfolio_url || '';
  const bio = user.user_metadata?.bio || '';
  const discipline = user.user_metadata?.discipline || '';
  const favoriteMediums = user.user_metadata?.favorite_mediums || [];
  const city = user.user_metadata?.city || '';
  const state = user.user_metadata?.state || '';
  const cityPublic = user.user_metadata?.city_public !== false;
  const statePublic = user.user_metadata?.state_public !== false;

  // Create slug for artist page
  const createSlug = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string') return 'user';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'user';
  };

  const userHandleForSlug = userMetadata.handle || null;
  const artistSlug = userHandleForSlug 
    ? (userHandleForSlug.replace('@', '').toLowerCase() || 'user')
    : createSlug(displayName || userName || emailPrefix);

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
                      <div style={{
                        fontSize: '1rem',
                        color: 'var(--text-light)',
                        margin: '0 0 2px 0',
                        fontFamily: 'var(--font-inter)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span>
                          {(() => {
                            const locationParts: string[] = [];
                            if (city && cityPublic) locationParts.push(city);
                            if (state && statePublic) locationParts.push(state);
                            const location = locationParts.length > 0 ? locationParts.join(', ') : null;
                            return location ? `${location} • Joined ${joinDate}` : `Joined ${joinDate}`;
                          })()}
                        </span>
                        {(() => {
                          const userMetadata = user?.user_metadata || {};
                          const membershipStatus = userMetadata.membership_status;
                          const hasPaidMembership = userMetadata.has_paid_membership;
                          const isFounder = userMetadata.is_founder === true;
                          const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;
                          if (!isPro) return null;
                          
                          if (isFounder) {
                            return (
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center',
                                position: 'relative',
                                width: '14px',
                                height: '14px',
                                marginLeft: '4px',
                                transform: 'translateY(-4px)'
                              }}>
                                <FounderBadge size={14} />
                              </span>
                            );
                          }
                          
                          return (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center',
                              position: 'relative',
                              width: '14px',
                              height: '14px',
                              marginLeft: '4px',
                              transform: 'translateY(-4px)'
                            }}>
                              <ProBadge size={14} />
                            </span>
                          );
                        })()}
                      </div>
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
                  <button
                    className={`${styles.tabButton} ${activeTab === 'exhibits' ? styles.tabButtonActive : ''}`}
                    onClick={() => setActiveTab('exhibits')}
                  >
                    Exhibits
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'subscription' ? styles.tabButtonActive : ''}`}
                    onClick={() => {
                      setActiveTab('subscription');
                      fetchSubscriptionStatus();
                    }}
                  >
                    Subscription
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
                            {editingArtworkId === artwork.id ? (
                              <div className={styles.artworkEditForm}>
                                <div className={styles.artworkItem}>
                                  <Image
                                    src={artwork.image_url}
                                    alt={artwork.title || 'Artwork'}
                                    width={300}
                                    height={300}
                                    className={styles.artworkImage}
                                  />
                                </div>
                                <div className={styles.editFormFields}>
                                  <input
                                    type="text"
                                    placeholder="Title"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className={styles.editInput}
                                    disabled={updatingArtwork}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Medium"
                                    value={editingMedium}
                                    onChange={(e) => setEditingMedium(e.target.value)}
                                    className={styles.editInput}
                                    disabled={updatingArtwork}
                                  />
                                  <div className={styles.editFormActions}>
                                    <button
                                      onClick={() => handleUpdateArtwork(artwork.id)}
                                      className={styles.saveButton}
                                      disabled={updatingArtwork}
                                    >
                                      {updatingArtwork ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className={styles.cancelEditButton}
                                      disabled={updatingArtwork}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditArtwork(artwork)}
                                  className={styles.editArtworkButton}
                                  title="Edit artwork"
                                >
                                  ✏️
                                </button>
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
                                    {(artwork.title || artwork.medium) && (
                                      <p className={styles.artworkItemTitle}>
                                        {artwork.title && artwork.medium
                                          ? `${artwork.title}, ${artwork.medium}`
                                          : artwork.title || artwork.medium}
                                      </p>
                                    )}
                                  </div>
                                </Link>
                              </>
                            )}
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
                        {(() => {
                          const userMetadata = user?.user_metadata || {};
                          const membershipStatus = userMetadata.membership_status;
                          const hasPaidMembership = userMetadata.has_paid_membership;
                          const isFounder = userMetadata.is_founder === true;
                          const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;
                          
                          if (!isPro) {
                            return (
                              <Link
                                href="/pricing"
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
                                UPGRADE TO POST
                              </Link>
                            );
                          }
                          
                          return (
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
                          );
                        })()}
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

                {/* Exhibits Tab Content */}
                {activeTab === 'exhibits' && (
                  <div className={styles.postsSection}>
                    <h4 className={styles.postsTitle}>My Exhibitions ({userExhibitions.length})</h4>
                    
                    {exhibitionsLoading ? (
                      <div className={styles.loading}>Loading exhibitions...</div>
                    ) : userExhibitions.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>You haven't posted any exhibitions yet.</p>
                        <a href="/community" className={styles.linkToCommunity}>
                          Go to Community →
                        </a>
                      </div>
                    ) : (
                      <div className={styles.postsList}>
                        {userExhibitions.map((exhibition: any) => {
                          const startDate = new Date(exhibition.start_date);
                          const formattedStartDate = startDate.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const endDate = exhibition.end_date ? new Date(exhibition.end_date) : null;
                          const formattedEndDate = endDate ? endDate.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }) : null;
                          
                          return (
                            <div key={exhibition.id} className={styles.post}>
                              <div className={styles.postContent} style={{ width: '100%' }}>
                                <div className={styles.postHeader}>
                                  <span className={styles.postName}>{exhibition.title}</span>
                                  <span className={styles.postTime}>{formatTimeAgo(exhibition.created_at)}</span>
                                </div>
                                <p className={styles.postText}>{exhibition.description}</p>
                                <div style={{ 
                                  marginTop: '8px', 
                                  marginBottom: '8px',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-light)',
                                  fontFamily: 'var(--font-inter)',
                                }}>
                                  <div style={{ marginBottom: '4px' }}>
                                    <strong>Start Date:</strong> {formattedStartDate}
                                    {formattedEndDate && (
                                      <>
                                        <br />
                                        <strong>End Date:</strong> {formattedEndDate}
                                      </>
                                    )}
                                  </div>
                                  <div>
                                    <strong>Location:</strong> {exhibition.location}
                                  </div>
                                </div>
                                <div className={styles.postFooter}>
                                  <p className={styles.postDate}>{formatDate(exhibition.created_at)}</p>
                                  <button
                                    onClick={() => handleDeleteExhibition(exhibition.id)}
                                    className={styles.deleteButton}
                                    title="Delete exhibition"
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

                {/* Subscription Tab Content */}
                {activeTab === 'subscription' && (() => {
                  // Check membership status from user metadata as fallback
                  const userMetadata = user?.user_metadata || {};
                  const membershipStatus = userMetadata.membership_status;
                  const hasPaidMembership = userMetadata.has_paid_membership;
                  const isFounder = userMetadata.is_founder === true;
                  const hasActiveMembership = membershipStatus === 'active' || hasPaidMembership === true || isFounder;
                  const hasSubscription = subscriptionStatus?.hasSubscription || hasActiveMembership;
                  
                  return (
                    <div className={styles.postsSection}>
                      {subscriptionLoading ? (
                        <div className={styles.loading}>Loading subscription status...</div>
                      ) : !hasSubscription ? (
                      <div className={styles.emptyState}>
                        <p>You don't have an active subscription.</p>
                        <Link
                          href="/pricing"
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
                          UPGRADE TO PRO
                        </Link>
                      </div>
                    ) : (
                      <div style={{
                        padding: '2rem',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                      }}>
                        <div style={{ marginBottom: '2rem' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                          }}>
                            <div>
                              <h5 style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: 'var(--text-dark)',
                                margin: '0 0 0.5rem 0',
                              }}>
                                {isFounder ? 'Founder Membership' : 'Pro Membership'}
                              </h5>
                              <p style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '1rem',
                                color: 'var(--text-light)',
                                margin: '0 0 0.75rem 0',
                              }}>
                                {isFounder ? 'Lifetime' : '$8/month'}
                              </p>
                              {!subscriptionStatus?.subscription?.cancel_at_period_end && (
                                <button
                                  onClick={handleCancelSubscription}
                                  disabled={subscriptionActionLoading || !hasActiveMembership}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    backgroundColor: 'transparent',
                                    color: '#ef4444',
                                    border: '1px solid #ef4444',
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: (subscriptionActionLoading || !hasActiveMembership) ? 'not-allowed' : 'pointer',
                                    opacity: (subscriptionActionLoading || !hasActiveMembership) ? 0.5 : 1,
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!subscriptionActionLoading && hasActiveMembership) {
                                      e.currentTarget.style.backgroundColor = '#ef4444';
                                      e.currentTarget.style.color = 'white';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!subscriptionActionLoading && hasActiveMembership) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.color = '#ef4444';
                                    }
                                  }}
                                >
                                  {subscriptionActionLoading ? 'Processing...' : 'Cancel Subscription'}
                                </button>
                              )}
                            </div>
                            <div style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              backgroundColor: (subscriptionStatus?.subscription?.status === 'active' || hasActiveMembership) ? '#10b981' : '#f59e0b',
                              color: 'white',
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                            }}>
                              {(subscriptionStatus?.subscription?.status === 'active' || hasActiveMembership) ? 'Active' : (subscriptionStatus?.subscription?.status || 'Active')}
                            </div>
                          </div>

                          {subscriptionStatus?.subscription?.current_period_end && (
                            <p style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.9rem',
                              color: 'var(--text-light)',
                              margin: '0.5rem 0',
                            }}>
                              {subscriptionStatus?.subscription?.cancel_at_period_end 
                                ? `Subscription will ${subscriptionStatus?.subscription?.cancel_at ? 'end' : 'be cancelled'} on ${new Date(subscriptionStatus?.subscription?.current_period_end! * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                : `Next billing date: ${new Date(subscriptionStatus?.subscription?.current_period_end! * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                              }
                            </p>
                          )}
                        </div>

                        {subscriptionStatus?.subscription?.cancel_at_period_end && subscriptionStatus?.subscription?.id && (
                          <div style={{
                            marginTop: '1rem',
                          }}>
                            <button
                              onClick={handleResumeSubscription}
                              disabled={subscriptionActionLoading}
                              style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                cursor: subscriptionActionLoading ? 'not-allowed' : 'pointer',
                                opacity: subscriptionActionLoading ? 0.7 : 1,
                                transition: 'background-color 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!subscriptionActionLoading) {
                                  e.currentTarget.style.backgroundColor = '#059669';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!subscriptionActionLoading) {
                                  e.currentTarget.style.backgroundColor = '#10b981';
                                }
                              }}
                            >
                              {subscriptionActionLoading ? 'Processing...' : 'Resume Subscription'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

