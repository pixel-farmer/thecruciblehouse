'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Resources.module.css';

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingMediums, setTrendingMediums] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingMediums = async () => {
      try {
        setTrendingLoading(true);
        const response = await fetch('/api/trending-mediums');
        
        console.log('[Resources] Response status:', response.status);
        console.log('[Resources] Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Clone the response so we can read it multiple times if needed
        const responseClone = response.clone();
        const text = await response.text();
        console.log('[Resources] Raw response text:', text);
        console.log('[Resources] Response text length:', text.length);
        
        let data;
        try {
          if (text.trim() === '') {
            console.warn('[Resources] Empty response body');
            data = { error: 'Empty response', message: 'The server returned an empty response' };
          } else {
            data = JSON.parse(text);
            console.log('[Resources] Parsed JSON data:', data);
          }
        } catch (parseError) {
          console.error('[Resources] Failed to parse JSON:', parseError);
          console.error('[Resources] Raw text that failed to parse:', text);
          data = { error: 'Invalid JSON response', message: 'Failed to parse server response', raw: text.substring(0, 500) };
        }
        
        if (response.ok) {
          if (data.trending && Array.isArray(data.trending)) {
            // Extract just the names from the trending array
            const mediumNames = data.trending.map((item: { name: string; count: number }) => item.name);
            setTrendingMediums(mediumNames);
            console.log('[Resources] Set trending mediums:', mediumNames);
          } else {
            console.warn('[Resources] No trending mediums in response:', data);
            setTrendingMediums([]);
          }
        } else {
          console.error('[Resources] Failed to fetch trending mediums. Status:', response.status, 'Error:', data);
          setTrendingMediums([]);
        }
      } catch (error) {
        console.error('[Resources] Error fetching trending mediums:', error);
        setTrendingMediums([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrendingMediums();
  }, []);

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
                  <h3 className={styles.sidebarTitle}>Trending Mediums</h3>
                  <div className={styles.trendingMediumsList}>
                    {trendingLoading ? (
                      <p className={styles.loadingText}>Loading...</p>
                    ) : trendingMediums.length > 0 ? (
                      <ol className={styles.trendingList}>
                        {trendingMediums.map((medium, index) => (
                          <li key={medium} className={styles.trendingItem}>
                            <span className={styles.trendingRank}>{index + 1}</span>
                            <span className={styles.trendingMedium}>{medium}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className={styles.emptyText}>No trending mediums yet</p>
                    )}
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Recommended Reading</h3>
                  <div className={styles.readingList}>
                    <Link 
                      href="https://amzn.to/48CxSN1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.readingItem}
                    >
                      <h5 className={styles.readingTitle}>The Artist's Way</h5>
                      <p className={styles.readingAuthor}>by Julia Cameron</p>
                    </Link>
                    <Link 
                      href="https://amzn.to/4pNgawn" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.readingItem}
                    >
                      <h5 className={styles.readingTitle}>The Creative Act: A Way of Being</h5>
                      <p className={styles.readingAuthor}>by Rick Rubin</p>
                    </Link>
                    <Link 
                      href="https://amzn.to/4qcZGO0" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.readingItem}
                    >
                      <h5 className={styles.readingTitle}>The Boy, the Mole, the Fox and the Horse</h5>
                      <p className={styles.readingAuthor}>by Charlie Mackesy</p>
                    </Link>
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

