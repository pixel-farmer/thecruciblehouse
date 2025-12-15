'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import ProBadge from '../components/ProBadge';
import styles from '../styles/Commissions.module.css';

interface Commission {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  budget_min: number;
  budget_max: number;
  location: string | null;
  is_remote: boolean;
  deadline: string | null;
  contact_email: string;
  contact_phone: string | null;
  client_name: string;
  created_at: string;
}

export default function CommissionsPage() {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProMembership, setHasProMembership] = useState(false);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showSignInMessage, setShowSignInMessage] = useState(false);

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

  const commissionTypes = [
    'All',
    'Personal',
    'Commercial',
  ];

  useEffect(() => {
    fetchCommissions();
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
        const userMetadata = session.user.user_metadata;
        const membershipStatus = userMetadata?.membership_status;
        const hasPaidMembership = userMetadata?.has_paid_membership;
        setHasProMembership(membershipStatus === 'active' || hasPaidMembership === true);
      } else {
        setHasProMembership(false);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      setHasProMembership(false);
    }
  };

  const handleApplyClick = async (commission: Commission) => {
    // First check if user is signed in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setShowSignInMessage(true);
      return;
    }
    
    // Check if user is pro
    if (!hasProMembership) {
      router.push('/pricing');
      return;
    }
    
    window.location.href = `mailto:${commission.contact_email}?subject=Application for ${commission.title}`;
  };

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/commissions');
      const data = await response.json();

      if (!response.ok) {
        // Provide more helpful error message if table doesn't exist
        if (data.code === 'TABLE_NOT_FOUND') {
          throw new Error('Database table not found. Please run the SQL migration in Supabase to create the commission_posts table.');
        }
        throw new Error(data.error || data.details || 'Failed to fetch commissions');
      }

      setCommissions(data.commissions || []);
    } catch (err: any) {
      console.error('Failed to fetch commissions:', err);
      setError(err.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    if (max >= 10000) {
      return `$${min.toLocaleString()}+`;
    }
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
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

  const filteredCommissions = commissions.filter((commission) => {
    const matchesKeyword = commission.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          commission.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           commission.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedType === 'all' || 
                      commission.type.toLowerCase() === selectedType.toLowerCase();
    const matchesLocation = !locationFilter || 
                           (commission.location && commission.location.toLowerCase().includes(locationFilter.toLowerCase()));
    const matchesRemote = !remoteOnly || commission.is_remote;
    
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
              <h1 className={styles.mainTitle}>Looking for Commission Work?</h1>
              <p className={styles.subtitle}>
                Find commission opportunities and connect with clients seeking custom artwork. 
                Browse available commissions or submit your own request.
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
                      Remote commissions only
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
                        {commissionTypes.map((type) => (
                          <option key={type} value={type === 'All' ? 'all' : type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.listingsSection}>
                  <h2 className={styles.sectionTitle}>Available Commissions</h2>
                  {loading ? (
                    <p className={styles.noResults}>Loading commissions...</p>
                  ) : error ? (
                    <p className={styles.noResults}>{error}</p>
                  ) : (
                    <div className={styles.commissionList}>
                      {filteredCommissions.length > 0 ? (
                        filteredCommissions.map((commission) => (
                          <div key={commission.id} className={styles.commissionCard}>
                            <div className={styles.commissionHeader}>
                              <h3 className={styles.commissionTitle}>{commission.title}</h3>
                              <span className={styles.commissionPosted}>
                                {formatTimeAgo(commission.created_at)}
                              </span>
                            </div>
                            <div className={styles.commissionMeta}>
                              <span className={styles.commissionClient}>
                                Client: {commission.client_name}
                              </span>
                              <span className={styles.commissionCategory}>{commission.category}</span>
                              <span className={styles.commissionType}>{commission.type}</span>
                              {commission.is_remote && (
                                <span className={styles.commissionType} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                                  Remote
                                </span>
                              )}
                            </div>
                            <p className={styles.commissionDescription}>{commission.description}</p>
                            {commission.location && (
                              <p className={styles.commissionDescription} style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '-10px' }}>
                                📍 {commission.location}
                              </p>
                            )}
                            <div className={styles.commissionFooter}>
                              <span className={styles.commissionBudget}>
                                Budget: {formatBudget(commission.budget_min, commission.budget_max)}
                              </span>
                              <button 
                                className={styles.applyButton}
                                onClick={() => handleApplyClick(commission)}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className={styles.noResults}>No commissions found matching your criteria.</p>
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
                                {member.isPro && <ProBadge size={14} />}
                              </div>
                            ) : (
                              <div className={styles.memberAvatar} style={{ position: 'relative' }}>
                                {member.initials || 'U'}
                                {member.isPro && <ProBadge size={14} />}
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
                    ) : commissions.length === 0 ? (
                      <div className={styles.activityItem}>
                        <p className={styles.activityText} style={{ color: 'var(--text-light)' }}>
                          No recent activity
                        </p>
                      </div>
                    ) : (
                      commissions.slice(0, 5).map((commission) => {
                        const clientName = commission.client_name || 'Someone';
                        const slug = createSlug(clientName);
                        return (
                          <div key={commission.id} className={styles.activityItem}>
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
                                <strong>{clientName}</strong>
                              </Link>{' '}
                              posted a new commission request
                            </p>
                            <span className={styles.activityTime}>
                              {formatTimeAgo(commission.created_at)}
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

