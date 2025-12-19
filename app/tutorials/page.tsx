'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Resources.module.css';

interface Tutorial {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  user_id: string;
  content?: string;
}

export default function TutorialsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingMediums, setTrendingMediums] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [tutorialsLoading, setTutorialsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [tutorialLoading, setTutorialLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        setTutorialsLoading(true);
        // For now, fetch from articles API filtered by category 'Tutorials'
        // Later, you can create a dedicated /api/tutorials endpoint
        const response = await fetch('/api/articles');
        
        if (response.ok) {
          const data = await response.json();
          const fetchedTutorials = (data.articles || [])
            .filter((article: any) => article.category === 'Tutorials')
            .map((tutorial: any) => ({
              id: tutorial.id,
              title: tutorial.title,
              excerpt: tutorial.excerpt,
              category: tutorial.category,
              date: new Date(tutorial.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              author: tutorial.author,
              readTime: tutorial.read_time || '5 min read',
              user_id: tutorial.user_id,
            }));
          setTutorials(fetchedTutorials);
        } else {
          console.error('[Tutorials] Failed to fetch tutorials:', response.status);
          setTutorials([]);
        }
      } catch (error) {
        console.error('[Tutorials] Error fetching tutorials:', error);
        setTutorials([]);
      } finally {
        setTutorialsLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  useEffect(() => {
    const fetchTrendingMediums = async () => {
      try {
        setTrendingLoading(true);
        const response = await fetch('/api/trending-mediums');
        
        const text = await response.text();
        let data;
        try {
          if (text.trim() === '') {
            data = { error: 'Empty response', message: 'The server returned an empty response' };
          } else {
            data = JSON.parse(text);
          }
        } catch (parseError) {
          console.error('[Tutorials] Failed to parse JSON:', parseError);
          data = { error: 'Invalid JSON response', message: 'Failed to parse server response' };
        }
        
        if (response.ok) {
          if (data.trending && Array.isArray(data.trending)) {
            const mediumNames = data.trending
              .slice(0, 5)
              .map((item: { name: string; count: number }) => item.name);
            setTrendingMediums(mediumNames);
          } else {
            setTrendingMediums([]);
          }
        } else {
          console.error('[Tutorials] Failed to fetch trending mediums. Status:', response.status);
          setTrendingMediums([]);
        }
      } catch (error) {
        console.error('[Tutorials] Error fetching trending mediums:', error);
        setTrendingMediums([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrendingMediums();
  }, []);

  const filteredTutorials = tutorials.filter((tutorial) =>
    tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutorial.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReadMore = async (tutorialId: string) => {
    setTutorialLoading(true);
    try {
      const response = await fetch(`/api/articles/${tutorialId}`);
      if (response.ok) {
        const data = await response.json();
        const tutorial = data.article;
        setSelectedTutorial({
          id: tutorial.id,
          title: tutorial.title,
          excerpt: tutorial.excerpt,
          category: tutorial.category,
          date: new Date(tutorial.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          author: tutorial.author,
          readTime: tutorial.read_time || '5 min read',
          user_id: tutorial.user_id,
          content: tutorial.content,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error('Failed to fetch tutorial:', response.status);
      }
    } catch (error) {
      console.error('Error fetching tutorial:', error);
    } finally {
      setTutorialLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedTutorial(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTutorial = async () => {
    if (!selectedTutorial) return;
    
    if (!confirm('Are you sure you want to delete this tutorial? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('You must be logged in to delete a tutorial.');
        return;
      }

      const response = await fetch(`/api/articles/${selectedTutorial.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete tutorial');
      }

      // Return to tutorials list
      setSelectedTutorial(null);
      // Refresh the tutorials list
      const tutorialsResponse = await fetch('/api/articles');
      if (tutorialsResponse.ok) {
        const tutorialsData = await tutorialsResponse.json();
        const fetchedTutorials = (tutorialsData.articles || [])
          .filter((article: any) => article.category === 'Tutorials')
          .map((tutorial: any) => ({
            id: tutorial.id,
            title: tutorial.title,
            excerpt: tutorial.excerpt,
            category: tutorial.category,
            date: new Date(tutorial.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            author: tutorial.author,
            readTime: tutorial.read_time || '5 min read',
            user_id: tutorial.user_id,
          }));
        setTutorials(fetchedTutorials);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error deleting tutorial:', err);
      alert(err.message || 'Failed to delete tutorial');
    } finally {
      setDeleting(false);
    }
  };

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
              <h1 className={styles.mainTitle}>Tutorials for Artists</h1>
              <p className={styles.subtitle}>
                Learn new techniques, improve your skills, and expand your artistic knowledge 
                with step-by-step tutorials from experienced artists in the community.
              </p>
            </div>
          </ScrollAnimation>

          {!selectedTutorial && (
            <div className={styles.searchSection}>
              <input
                type="text"
                placeholder="Search for:"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}

          <div className={styles.contentLayout}>
            <div className={styles.mainContent}>
              {selectedTutorial ? (
                <ScrollAnimation>
                  <div className={styles.articleDetail}>
                    <button 
                      onClick={handleBackToList}
                      className={styles.backButton}
                    >
                      ← Back to Tutorials
                    </button>
                    
                    {tutorialLoading ? (
                      <p className={styles.loadingText}>Loading tutorial...</p>
                    ) : (
                      <>
                        <div className={styles.articleDetailHeader}>
                          <span className={styles.articleCategory}>{selectedTutorial.category}</span>
                          <span className={styles.articleDate}>{selectedTutorial.date}</span>
                        </div>
                        <h1 className={styles.articleDetailTitle}>{selectedTutorial.title}</h1>
                        <div className={styles.articleDetailMeta}>
                          <span className={styles.articleAuthor}>By {selectedTutorial.author}</span>
                          <span className={styles.articleReadTime}>{selectedTutorial.readTime}</span>
                          {currentUserId === selectedTutorial.user_id && (
                            <>
                              <Link 
                                href={`/resources/edit-article/${selectedTutorial.id}`}
                                className={styles.editButton}
                              >
                                Edit Tutorial
                              </Link>
                              <button
                                onClick={handleDeleteTutorial}
                                disabled={deleting}
                                style={{
                                  padding: '10px 25px',
                                  backgroundColor: '#dc3545',
                                  color: 'var(--white)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: deleting ? 'not-allowed' : 'pointer',
                                  fontSize: '0.95rem',
                                  fontWeight: 500,
                                  fontFamily: 'var(--font-inter)',
                                  transition: 'all 0.3s ease',
                                  opacity: deleting ? 0.6 : 1,
                                  whiteSpace: 'nowrap',
                                  lineHeight: '1.5',
                                  boxSizing: 'border-box',
                                }}
                                onMouseEnter={(e) => {
                                  if (!deleting) {
                                    e.currentTarget.style.backgroundColor = '#c82333';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!deleting) {
                                    e.currentTarget.style.backgroundColor = '#dc3545';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }
                                }}
                              >
                                {deleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </>
                          )}
                        </div>
                        <div className={styles.articleDetailContent}>
                          {selectedTutorial.content?.split('\n').map((line, index) => {
                            // Check if line is a markdown image: ![alt](url)
                            const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
                            if (imageMatch) {
                              const [, alt, url] = imageMatch;
                              return (
                                <div key={index} style={{ margin: '20px 0', textAlign: 'center' }}>
                                  <img
                                    src={url}
                                    alt={alt || 'Tutorial image'}
                                    style={{
                                      maxWidth: '100%',
                                      height: 'auto',
                                      borderRadius: '8px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                  />
                                </div>
                              );
                            }
                            // Regular paragraph
                            return line.trim() && (
                              <p key={index}>{line}</p>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </ScrollAnimation>
              ) : (
                <ScrollAnimation>
                  <div className={styles.articlesSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 className={styles.sectionTitle}>Latest Tutorials</h2>
                      <Link 
                        href="/tutorials/write-tutorial"
                        style={{
                          padding: '10px 20px',
                          backgroundColor: 'var(--accent-color)',
                          color: 'var(--white)',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          transition: 'background-color 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e55a1a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                        }}
                      >
                        Post Tutorial
                      </Link>
                    </div>
                    <div className={styles.articlesList}>
                      {tutorialsLoading ? (
                        <p className={styles.loadingText}>Loading tutorials...</p>
                      ) : filteredTutorials.length > 0 ? (
                        filteredTutorials.map((tutorial) => (
                          <article key={tutorial.id} className={styles.articleCard}>
                            <div className={styles.articleHeader}>
                              <span className={styles.articleCategory}>{tutorial.category}</span>
                              <span className={styles.articleDate}>{tutorial.date}</span>
                            </div>
                            <h3 className={styles.articleTitle}>{tutorial.title}</h3>
                            <p className={styles.articleExcerpt}>{tutorial.excerpt}</p>
                            <div className={styles.articleFooter}>
                              <div className={styles.articleMeta}>
                                <span className={styles.articleAuthor}>By {tutorial.author}</span>
                                <span className={styles.articleReadTime}>{tutorial.readTime}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {currentUserId === tutorial.user_id && (
                                  <Link 
                                    href={`/resources/edit-article/${tutorial.id}`}
                                    className={styles.editButton}
                                  >
                                    Edit
                                  </Link>
                                )}
                                <button 
                                  className={styles.readMoreButton}
                                  onClick={() => handleReadMore(tutorial.id)}
                                >
                                  Read More
                                </button>
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className={styles.noResults}>No tutorials found matching your search.</p>
                      )}
                    </div>
                  </div>
                </ScrollAnimation>
              )}
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
                    <Link 
                      href="https://amzn.to/44vC1Qr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.readingItem}
                    >
                      <h5 className={styles.readingTitle}>Artists' Master Series: Color and Light</h5>
                      <p className={styles.readingAuthor}>by Pickard, Knoff, Guweiz, Fowkes</p>
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
