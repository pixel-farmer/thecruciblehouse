'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Resources.module.css';

interface Article {
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

export default function ResourcesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingMediums, setTrendingMediums] = useState<string[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setArticlesLoading(true);
        const response = await fetch('/api/articles');
        
        if (response.ok) {
          const data = await response.json();
          const fetchedArticles = (data.articles || []).map((article: any) => ({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt,
            category: article.category,
            date: new Date(article.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            author: article.author,
            readTime: article.read_time || '5 min read',
            user_id: article.user_id,
          }));
          setArticles(fetchedArticles);
        } else {
          console.error('[Resources] Failed to fetch articles:', response.status);
          setArticles([]);
        }
      } catch (error) {
        console.error('[Resources] Error fetching articles:', error);
        setArticles([]);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchArticles();
  }, []);

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

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReadMore = async (articleId: string) => {
    setArticleLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`);
      if (response.ok) {
        const data = await response.json();
        const article = data.article;
        setSelectedArticle({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          category: article.category,
          date: new Date(article.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          author: article.author,
          readTime: article.read_time || '5 min read',
          user_id: article.user_id,
          content: article.content,
        });
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error('Failed to fetch article:', response.status);
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setArticleLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <h1 className={styles.mainTitle}>Latest News & Tips for Artists</h1>
              <p className={styles.subtitle}>
                Stay updated and embrace your artistic journey with these valuable resources, 
                tutorials, and insights from the art community.
              </p>
            </div>
          </ScrollAnimation>

          {!selectedArticle && (
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
              {selectedArticle ? (
                <ScrollAnimation>
                  <div className={styles.articleDetail}>
                    <button 
                      onClick={handleBackToList}
                      className={styles.backButton}
                    >
                      ← Back to Articles
                    </button>
                    
                    {articleLoading ? (
                      <p className={styles.loadingText}>Loading article...</p>
                    ) : (
                      <>
                        <div className={styles.articleDetailHeader}>
                          <span className={styles.articleCategory}>{selectedArticle.category}</span>
                          <span className={styles.articleDate}>{selectedArticle.date}</span>
                        </div>
                        <h1 className={styles.articleDetailTitle}>{selectedArticle.title}</h1>
                        <div className={styles.articleDetailMeta}>
                          <span className={styles.articleAuthor}>By {selectedArticle.author}</span>
                          <span className={styles.articleReadTime}>{selectedArticle.readTime}</span>
                          {currentUserId === selectedArticle.user_id && (
                            <Link 
                              href={`/resources/edit-article/${selectedArticle.id}`}
                              className={styles.editButton}
                            >
                              Edit Article
                            </Link>
                          )}
                        </div>
                        <div className={styles.articleDetailContent}>
                          {selectedArticle.content?.split('\n').map((paragraph, index) => (
                            paragraph.trim() && (
                              <p key={index}>{paragraph}</p>
                            )
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </ScrollAnimation>
              ) : (
                <ScrollAnimation>
                  <div className={styles.articlesSection}>
                    <h2 className={styles.sectionTitle}>Latest Articles</h2>
                    <div className={styles.articlesList}>
                      {articlesLoading ? (
                        <p className={styles.loadingText}>Loading articles...</p>
                      ) : filteredArticles.length > 0 ? (
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
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {currentUserId === article.user_id && (
                                  <Link 
                                    href={`/resources/edit-article/${article.id}`}
                                    className={styles.editButton}
                                  >
                                    Edit
                                  </Link>
                                )}
                                <button 
                                  className={styles.readMoreButton}
                                  onClick={() => handleReadMore(article.id)}
                                >
                                  Read More
                                </button>
                              </div>
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className={styles.noResults}>No articles found matching your search.</p>
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

