'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Resources.module.css';

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const articles = [
    {
      id: 1,
      title: '10 Marketing Strategies for Artists in 2025',
      excerpt: 'Learn how to effectively market your artwork and build your brand in the digital age. Discover proven strategies that work for both emerging and established artists.',
      category: 'Marketing',
      date: 'March 15, 2025',
      author: 'Sarah Johnson',
      readTime: '5 min read',
    },
    {
      id: 2,
      title: 'Mastering Color Theory: A Comprehensive Guide',
      excerpt: 'A detailed guide to understanding and applying color theory in your artwork. From basic principles to advanced techniques, this resource covers everything you need to know.',
      category: 'Techniques',
      date: 'March 10, 2025',
      author: 'Michael Chen',
      readTime: '8 min read',
    },
    {
      id: 3,
      title: 'Building Your Art Business: Essential Tips',
      excerpt: 'Essential tips for turning your passion into a sustainable business. Learn about pricing, contracts, client management, and more.',
      category: 'Business',
      date: 'March 5, 2025',
      author: 'Emma Williams',
      readTime: '6 min read',
    },
    {
      id: 4,
      title: 'Digital Art Techniques Tutorial',
      excerpt: 'Step-by-step tutorial on creating stunning digital artwork using modern tools. Perfect for artists transitioning from traditional to digital media.',
      category: 'Tutorials',
      date: 'February 28, 2025',
      author: 'Alex Brown',
      readTime: '12 min read',
    },
    {
      id: 5,
      title: 'Portrait Photography Tips for Artists',
      excerpt: 'Learn how to capture reference photos that will enhance your portrait paintings. Professional photography techniques adapted for artists.',
      category: 'Photography',
      date: 'February 22, 2025',
      author: 'David Lee',
      readTime: '7 min read',
    },
    {
      id: 6,
      title: 'Understanding Art Contracts and Legal Basics',
      excerpt: 'Navigate the legal aspects of selling art, including contracts, copyright, and licensing. Essential knowledge for professional artists.',
      category: 'Business',
      date: 'February 18, 2025',
      author: 'Jennifer Martinez',
      readTime: '10 min read',
    },
  ];

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.resources} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div className={styles.header}>
              <h1 className={styles.mainTitle}>Latest News & Tips for Artists</h1>
              <p className={styles.subtitle}>
                Stay updated and embrace your artistic journey with these valuable resources, 
                tutorials, and insights from the art community.
              </p>
            </div>
          </ScrollAnimation>

          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search for:"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.contentLayout}>
            <div className={styles.mainContent}>
              <ScrollAnimation>
                <div className={styles.articlesSection}>
                  <h2 className={styles.sectionTitle}>Latest Articles</h2>
                  <div className={styles.articlesList}>
                    {filteredArticles.length > 0 ? (
                      filteredArticles.map((article) => (
                        <article key={article.id} className={styles.articleCard}>
                          <div className={styles.articleHeader}>
                            <span className={styles.articleCategory}>{article.category}</span>
                            <span className={styles.articleDate}>{article.date}</span>
                          </div>
                          <h3 className={styles.articleTitle}>{article.title}</h3>
                          <p className={styles.articleExcerpt}>{article.excerpt}</p>
                          <div className={styles.articleFooter}>
                            <div className={styles.articleMeta}>
                              <span className={styles.articleAuthor}>By {article.author}</span>
                              <span className={styles.articleReadTime}>{article.readTime}</span>
                            </div>
                            <button className={styles.readMoreButton}>Read More</button>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className={styles.noResults}>No articles found matching your search.</p>
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
                    <div className={styles.memberItem}>
                      <div className={styles.memberAvatar}>MC</div>
                      <div className={styles.memberInfo}>
                        <p className={styles.memberName}>Mike Chen</p>
                        <p className={styles.memberActivity}>Active 1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Groups</h3>
                  <div className={styles.groupTabs}>
                    <button className={styles.groupTab}>Newest</button>
                    <button className={styles.groupTab}>Active</button>
                    <button className={styles.groupTab}>Popular</button>
                  </div>
                  <div className={styles.groupList}>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Digital Artists Collective</h5>
                      <p className={styles.groupActivity}>active 11 hours ago</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Traditional Techniques</h5>
                      <p className={styles.groupActivity}>active a day ago</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Business & Marketing</h5>
                      <p className={styles.groupActivity}>active a day ago</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Portrait Artists</h5>
                      <p className={styles.groupActivity}>active a day ago</p>
                    </div>
                    <div className={styles.groupItem}>
                      <h5 className={styles.groupName}>Landscape Specialists</h5>
                      <p className={styles.groupActivity}>active 2 days ago</p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Latest Updates</h3>
                  <div className={styles.activityList}>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Genevieve</strong> posted an update in the group{' '}
                        <strong>Digital Artists Collective</strong>
                      </p>
                      <span className={styles.activityTime}>11 hours ago</span>
                    </div>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Michael</strong> posted an update in the group{' '}
                        <strong>Traditional Techniques</strong>
                      </p>
                      <span className={styles.activityTime}>a day ago</span>
                    </div>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Sarah</strong> posted an update
                      </p>
                      <span className={styles.activityTime}>2 days ago</span>
                    </div>
                    <div className={styles.activityItem}>
                      <p className={styles.activityText}>
                        <strong>Alex</strong> posted an update in the group{' '}
                        <strong>Business & Marketing</strong>
                      </p>
                      <span className={styles.activityTime}>2 days ago</span>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Recent Commission Listings</h3>
                  <div className={styles.listingList}>
                    <div className={styles.listingItem}>
                      <h5 className={styles.listingTitle}>Custom Portrait Commission</h5>
                      <p className={styles.listingMeta}>Personal • $500 - $1,000</p>
                    </div>
                    <div className={styles.listingItem}>
                      <h5 className={styles.listingTitle}>Corporate Art Installation</h5>
                      <p className={styles.listingMeta}>Commercial • $5,000+</p>
                    </div>
                    <div className={styles.listingItem}>
                      <h5 className={styles.listingTitle}>Landscape Painting</h5>
                      <p className={styles.listingMeta}>Personal • $800 - $1,500</p>
                    </div>
                    <div className={styles.listingItem}>
                      <h5 className={styles.listingTitle}>Digital Art Commission</h5>
                      <p className={styles.listingMeta}>Commercial • $2,000 - $4,000</p>
                    </div>
                    <div className={styles.listingItem}>
                      <h5 className={styles.listingTitle}>Sculpture Commission</h5>
                      <p className={styles.listingMeta}>Commercial • $10,000+</p>
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

