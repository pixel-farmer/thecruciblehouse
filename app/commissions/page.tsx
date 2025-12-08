'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ScrollAnimation from '../components/ScrollAnimation';
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

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
                                onClick={() => window.location.href = `mailto:${commission.contact_email}?subject=Application for ${commission.title}`}
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
                  <h3 className={styles.sidebarTitle}>What's Happening</h3>
                  <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Genevieve</strong> posted a new commission request
                      </p>
                      <span className={styles.activityTime}>11 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Michael</strong> completed a portrait commission
                      </p>
                      <span className={styles.activityTime}>2 days ago</span>
                    </div>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Sarah</strong> posted an update in the group
                      </p>
                      <span className={styles.activityTime}>3 days ago</span>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Groups</h3>
                  <div className={styles.groupList}>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Portrait Artists</h5>
                      <p className={styles.groupMembers}>245 members</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Landscape Specialists</h5>
                      <p className={styles.groupMembers}>189 members</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Digital Artists</h5>
                      <p className={styles.groupMembers}>312 members</p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </aside>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

