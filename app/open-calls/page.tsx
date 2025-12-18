'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import ProBadge from '../components/ProBadge';
import FounderBadge from '../components/FounderBadge';
import styles from '../styles/Commissions.module.css';

interface OpenCall {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  deadline: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_remote: boolean;
  prizes: string | null;
  application_fee: number;
  fee_currency: string;
  view_count: number;
  contact_email: string;
  gallery_name: string | null;
  website: string;
  header_image: string | null;
  organizer_name: string;
  created_at: string;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    slug: string;
  };
}

export default function OpenCallsPage() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [openCalls, setOpenCalls] = useState<OpenCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProMembership, setHasProMembership] = useState(false);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showSignInMessage, setShowSignInMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = [
    'All',
    'Traditional',
    '3D',
    'Sculpture',
    'Photography',
    'Digital',
    'Crafts',
    'Textile',
    'Experimental',
    'Other',
  ];

  const callTypes = [
    'All',
    'Exhibition',
    'Residency',
    'Competition',
    'Grant',
    'Publication',
    'Other',
  ];

  useEffect(() => {
    fetchOpenCalls();
    checkMembershipStatus();
    fetchRecentMembers();
  }, []);

  const fetchRecentMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await fetch('/api/members/recent');
      
      if (response.ok) {
        const data = await response.json();
        setRecentMembers(data.members || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch recent members:', response.status, errorData);
        setRecentMembers([]);
      }
    } catch (error) {
      console.error('Error fetching recent members:', error);
      setRecentMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const checkMembershipStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const userMetadata = session.user.user_metadata;
        const membershipStatus = userMetadata?.membership_status;
        const hasPaidMembership = userMetadata?.has_paid_membership;
        const isFounder = userMetadata?.is_founder === true;
        setHasProMembership(membershipStatus === 'active' || hasPaidMembership === true || isFounder);
      } else {
        setCurrentUserId(null);
        setHasProMembership(false);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      setHasProMembership(false);
      setCurrentUserId(null);
    }
  };

  const handleApplyClick = async (openCall: OpenCall) => {
    // Check if user is signed in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setShowSignInMessage(true);
      return;
    }
    
    // Open the website in a new tab
    window.open(openCall.website, '_blank', 'noopener,noreferrer');
  };

  const handleEditClick = (e: React.MouseEvent, openCall: OpenCall) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/open-calls/edit/${openCall.id}`);
  };

  const handleDeleteClick = async (e: React.MouseEvent, openCallId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this open call? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(openCallId);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setShowSignInMessage(true);
        return;
      }

      const response = await fetch(`/api/open-calls?id=${openCallId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete open call');
      }

      // Remove the deleted open call from the list
      setOpenCalls(prev => prev.filter(call => call.id !== openCallId));
    } catch (err: any) {
      console.error('Error deleting open call:', err);
      alert(err.message || 'Failed to delete open call');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchOpenCalls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/open-calls');
      const data = await response.json();

      if (!response.ok) {
        // Provide more helpful error message if table doesn't exist
        if (data.code === 'TABLE_NOT_FOUND') {
          throw new Error('Database table not found. Please run the SQL migration in Supabase to create the open_calls table.');
        }
        throw new Error(data.error || data.details || 'Failed to fetch open calls');
      }

      setOpenCalls(data.openCalls || []);
    } catch (err: any) {
      console.error('Failed to fetch open calls:', err);
      setError(err.message || 'Failed to load open calls');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  // Helper function to create slug from name
  const createSlug = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string') return 'user';
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'user';
  };

  const filteredOpenCalls = openCalls.filter((openCall) => {
    const matchesKeyword = openCall.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          openCall.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           openCall.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedType === 'all' || 
                      openCall.type.toLowerCase() === selectedType.toLowerCase();
    const locationString = [openCall.city, openCall.state, openCall.country].filter(Boolean).join(', ');
    const matchesLocation = !locationFilter || 
                           locationString.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesRemote = !remoteOnly || openCall.is_remote;
    
    return matchesKeyword && matchesCategory && matchesType && matchesLocation && matchesRemote;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.commissions} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div className={styles.header}>
              <h1 className={styles.mainTitle}>Open Calls for Artists</h1>
              <p className={styles.subtitle}>
                Discover exhibition opportunities, residencies, competitions, grants, and publication calls. 
                Find your next opportunity to showcase your work.
              </p>
            </div>
          </ScrollAnimation>

          <div className={styles.contentLayout}>
            <div className={styles.mainContent}>
              <ScrollAnimation>
                <div className={styles.searchSection}>
                  <div className={styles.searchBar}>
                    <input
                      type="text"
                      placeholder="Keywords"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className={styles.searchInput}
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className={styles.searchInput}
                    />
                    <label className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" 
                        checked={remoteOnly}
                        onChange={(e) => setRemoteOnly(e.target.checked)}
                      />
                      Remote opportunities only
                    </label>
                  </div>

                  <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                      <label>Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={styles.filterSelect}
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat === 'All' ? 'all' : cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.filterGroup}>
                      <label>Type</label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className={styles.filterSelect}
                      >
                        {callTypes.map((type) => (
                          <option key={type} value={type === 'All' ? 'all' : type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.postJobButtonContainer}>
                      <Link
                        href="/open-calls/post"
                        className={styles.postJobButton}
                      >
                        Post Open Call
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.listingsSection}>
                  <h2 className={styles.sectionTitle}>Available Open Calls</h2>
                  {loading ? (
                    <p className={styles.noResults}>Loading open calls...</p>
                  ) : error ? (
                    <p className={styles.noResults}>{error}</p>
                  ) : (
                    <div className={styles.openCallsGrid}>
                      {filteredOpenCalls.length > 0 ? (
                        filteredOpenCalls.map((openCall) => (
                          <Link
                            key={openCall.id}
                            href={`/open-calls/${openCall.id}`}
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              display: 'block',
                            }}
                          >
                            <div 
                              className={`${styles.commissionCard} ${styles.openCallCard}`}
                              style={{
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                /* Prevent text selection on hover */
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                              }}
                            >
                              {openCall.header_image ? (
                                <div style={{ 
                                  width: '100%', 
                                  height: '180px', 
                                  marginBottom: '15px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                  backgroundColor: 'var(--secondary-color)'
                                }}>
                                  <Image
                                    src={openCall.header_image}
                                    alt={openCall.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              ) : (
                                <div style={{ 
                                  width: '100%', 
                                  height: '180px', 
                                  marginBottom: '15px',
                                  borderRadius: '8px',
                                  backgroundColor: 'var(--secondary-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-light)',
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.9rem'
                                }}>
                                  No Image
                                </div>
                              )}
                              
                              <h3 className={styles.commissionTitle} style={{ 
                                fontSize: '1.2rem', 
                                marginBottom: '10px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.4'
                              }}>
                                {openCall.title}
                              </h3>

                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '8px',
                                marginBottom: '15px',
                                flex: 1
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: 'var(--text-light)',
                                    fontFamily: 'var(--font-inter)'
                                  }}>
                                    📅
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.9rem', 
                                    color: 'var(--text-dark)',
                                    fontFamily: 'var(--font-inter)',
                                    fontWeight: 500
                                  }}>
                                    {formatDate(openCall.deadline)}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: 'var(--text-light)',
                                    fontFamily: 'var(--font-inter)'
                                  }}>
                                    👁️
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.9rem', 
                                    color: 'var(--text-dark)',
                                    fontFamily: 'var(--font-inter)'
                                  }}>
                                    {openCall.view_count || 0} Views
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: 'var(--text-light)',
                                    fontFamily: 'var(--font-inter)'
                                  }}>
                                    🏛️
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.9rem', 
                                    color: 'var(--text-dark)',
                                    fontFamily: 'var(--font-inter)',
                                    fontWeight: 500
                                  }}>
                                    {openCall.gallery_name || openCall.owner.name}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: 'var(--text-light)',
                                    fontFamily: 'var(--font-inter)'
                                  }}>
                                    💰
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.9rem', 
                                    color: openCall.application_fee === 0 ? '#4CAF50' : 'var(--text-dark)',
                                    fontFamily: 'var(--font-inter)',
                                    fontWeight: 500
                                  }}>
                                    {openCall.application_fee === 0 
                                      ? 'Free' 
                                      : `${openCall.fee_currency === 'USD' ? '$' : openCall.fee_currency} ${openCall.application_fee.toLocaleString()}`
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className={styles.noResults}>No open calls found matching your criteria.</p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollAnimation>
            </div>

            <aside className={styles.sidebar}>
              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Recently Active Members</h3>
                  {membersLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                      Loading...
                    </div>
                  ) : recentMembers.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
                      No active members yet.
                    </div>
                  ) : (
                    <div className={styles.memberList}>
                      {recentMembers.map((member) => (
                        <Link key={member.id} href={`/artist/${member.slug || member.id}`} style={{ textDecoration: 'none' }}>
                          <div className={styles.memberItem}>
                            {member.avatar && member.avatar.startsWith('http') ? (
                              <div className={styles.memberAvatarImage} style={{ position: 'relative' }}>
                                <Image
                                  src={member.avatar}
                                  alt={member.name || 'Member'}
                                  width={45}
                                  height={45}
                                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                                />
                                {member.isFounder ? <FounderBadge size={14} /> : member.isPro && <ProBadge size={14} />}
                              </div>
                            ) : (
                              <div className={styles.memberAvatar} style={{ position: 'relative' }}>
                                {member.initials || 'U'}
                                {member.isFounder ? <FounderBadge size={14} /> : member.isPro && <ProBadge size={14} />}
                              </div>
                            )}
                            <div className={styles.memberInfo}>
                              <p className={styles.memberName}>{member.name || 'Unknown'}</p>
                              <p className={styles.memberActivity}>{member.activity || 'Recently active'}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>What's Happening</h3>
                  <div className={styles.activityList}>
                    {loading ? (
                      <div className={styles.activityItem}>
                        <p className={styles.activityText}>Loading...</p>
                      </div>
                    ) : openCalls.length === 0 ? (
                      <div className={styles.activityItem}>
                        <p className={styles.activityText} style={{ color: 'var(--text-light)' }}>
                          No recent activity
                        </p>
                      </div>
                    ) : (
                      openCalls.slice(0, 5).map((openCall) => {
                        const organizerName = openCall.organizer_name || 'Someone';
                        const slug = createSlug(organizerName);
                        return (
                          <div key={openCall.id} className={styles.activityItem}>
                            <p className={styles.activityText}>
                              <Link 
                                href={`/artist/${slug}`}
                                style={{ 
                                  textDecoration: 'none', 
                                  color: 'inherit',
                                  fontWeight: 600 
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--accent-color)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'inherit';
                                }}
                              >
                                <strong>{organizerName}</strong>
                              </Link>{' '}
                              posted a new open call
                            </p>
                            <span className={styles.activityTime}>
                              {formatTimeAgo(openCall.created_at)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </ScrollAnimation>
            </aside>
          </div>
        </div>
      </section>

      {/* Sign In Message Modal */}
      {showSignInMessage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowSignInMessage(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#333',
            }}>
              Sign In Required
            </h3>
            <p style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              color: '#666',
              marginBottom: '1.5rem',
            }}>
              Please sign in to use this feature.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSignInMessage(false)}
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <Link
                href="/login"
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: '#ff6622',
                  color: 'white',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e55a1a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6622';
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
