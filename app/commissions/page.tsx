'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Commissions.module.css';

export default function CommissionsPage() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const categories = [
    'All',
    'Portrait',
    'Landscape',
    'Abstract',
    'Custom',
    'Digital',
    'Traditional',
    'Sculpture',
    'Mixed Media',
  ];

  const commissionTypes = [
    'All',
    'Personal',
    'Commercial',
    'Portrait',
    'Landscape',
    'Abstract',
  ];

  const commissionListings = [
    {
      id: 1,
      title: 'Custom Portrait Commission',
      client: 'Sarah Johnson',
      category: 'Portrait',
      type: 'Personal',
      budget: '$500 - $1,000',
      description: 'Looking for a custom portrait of my family in a traditional style.',
      posted: '2 hours ago',
    },
    {
      id: 2,
      title: 'Corporate Art Installation',
      client: 'Tech Corp Inc.',
      category: 'Abstract',
      type: 'Commercial',
      budget: '$5,000 - $10,000',
      description: 'Large-scale abstract piece for office lobby, modern aesthetic preferred.',
      posted: '5 hours ago',
    },
    {
      id: 3,
      title: 'Landscape Painting',
      client: 'Michael Chen',
      category: 'Landscape',
      type: 'Personal',
      budget: '$800 - $1,500',
      description: 'Mountain landscape scene for home office, prefer oil or acrylic.',
      posted: '1 day ago',
    },
    {
      id: 4,
      title: 'Digital Art Commission',
      client: 'Gaming Studio',
      category: 'Digital',
      type: 'Commercial',
      budget: '$2,000 - $4,000',
      description: 'Character design and concept art for upcoming game project.',
      posted: '2 days ago',
    },
    {
      id: 5,
      title: 'Sculpture Commission',
      client: 'Public Art Foundation',
      category: 'Sculpture',
      type: 'Commercial',
      budget: '$10,000+',
      description: 'Public art installation for city park, seeking experienced sculptor.',
      posted: '3 days ago',
    },
    {
      id: 6,
      title: 'Pet Portrait',
      client: 'Emma Williams',
      category: 'Portrait',
      type: 'Personal',
      budget: '$300 - $600',
      description: 'Watercolor portrait of my golden retriever, gift for anniversary.',
      posted: '4 days ago',
    },
  ];

  const filteredCommissions = commissionListings.filter((commission) => {
    const matchesKeyword = commission.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          commission.description.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || commission.category === selectedCategory;
    const matchesType = selectedType === 'all' || commission.type === selectedType;
    return matchesKeyword && matchesCategory && matchesType;
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
                      className={styles.searchInput}
                    />
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" />
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
                          <option key={cat} value={cat === 'All' ? 'all' : cat.toLowerCase()}>
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
                          <option key={type} value={type === 'All' ? 'all' : type.toLowerCase()}>
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
                  <div className={styles.commissionList}>
                    {filteredCommissions.length > 0 ? (
                      filteredCommissions.map((commission) => (
                        <div key={commission.id} className={styles.commissionCard}>
                          <div className={styles.commissionHeader}>
                            <h3 className={styles.commissionTitle}>{commission.title}</h3>
                            <span className={styles.commissionPosted}>{commission.posted}</span>
                          </div>
                          <div className={styles.commissionMeta}>
                            <span className={styles.commissionClient}>Client: {commission.client}</span>
                            <span className={styles.commissionCategory}>{commission.category}</span>
                            <span className={styles.commissionType}>{commission.type}</span>
                          </div>
                          <p className={styles.commissionDescription}>{commission.description}</p>
                          <div className={styles.commissionFooter}>
                            <span className={styles.commissionBudget}>Budget: {commission.budget}</span>
                            <button className={styles.applyButton}>Apply</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.noResults}>No commissions found matching your criteria.</p>
                    )}
                  </div>
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

