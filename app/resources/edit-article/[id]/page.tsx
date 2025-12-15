'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '@/app/components/ScrollAnimation';
import styles from '../../write-article/WriteArticle.module.css';

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: '',
    content: '',
  });

  const categories = [
    'Marketing',
    'Techniques',
    'Business',
    'Tutorials',
    'Photography',
  ];

  // Check access and load article
  useEffect(() => {
    const checkAccessAndLoadArticle = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          router.push('/login');
          return;
        }

        // Fetch the article
        const response = await fetch(`/api/articles/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Article not found.');
            setLoading(false);
            setCheckingAccess(false);
            return;
          }
          throw new Error('Failed to fetch article');
        }

        const data = await response.json();
        const article = data.article;

        // Check if user is the owner
        if (article.user_id !== session.user.id) {
          setError('You do not have permission to edit this article.');
          setLoading(false);
          setCheckingAccess(false);
          return;
        }

        // Pre-fill form with existing data
        setFormData({
          title: article.title || '',
          excerpt: article.excerpt || '',
          category: article.category || '',
          content: article.content || '',
        });

        setLoading(false);
        setCheckingAccess(false);
      } catch (error) {
        console.error('Error checking access:', error);
        setError('An error occurred while loading the article.');
        setLoading(false);
        setCheckingAccess(false);
      }
    };

    checkAccessAndLoadArticle();
  }, [id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateReadTime = (content: string): string => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        setError('You must be logged in to edit an article.');
        setIsSubmitting(false);
        return;
      }

      const readTime = calculateReadTime(formData.content);

      const response = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          category: formData.category,
          content: formData.content,
          readTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to update article';
        const errorDetails = data.details ? ` ${data.details}` : '';
        const errorCode = data.code ? ` (Code: ${data.code})` : '';
        throw new Error(`${errorMessage}${errorDetails}${errorCode}`);
      }

      setSuccess(true);
      
      // Redirect to resources page after 2 seconds
      setTimeout(() => {
        router.push('/resources');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating article:', err);
      setError(err.message || 'An error occurred while updating your article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAccess || loading) {
    return (
      <div className={styles.postArticle}>
        <div className={styles.container}>
          <div className={styles.loading}>{loading ? 'Loading article...' : 'Checking access...'}</div>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.postArticle} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div className={styles.header}>
              <h1 className={styles.mainTitle}>Edit Article</h1>
              <p className={styles.subtitle}>
                Update your article content and information.
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className={styles.formContainer}>
              {success && (
                <div className={styles.successMessage}>
                  <p>✓ Your article has been updated successfully! Redirecting to Resources page...</p>
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  <p>✗ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Article Details</h2>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="title">Article Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 10 Marketing Strategies for Artists in 2025"
                      className={styles.input}
                      maxLength={200}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="excerpt">Excerpt *</label>
                    <textarea
                      id="excerpt"
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleChange}
                      required
                      placeholder="Write a brief summary of your article that will appear in the article list..."
                      rows={3}
                      className={styles.textarea}
                      maxLength={300}
                    />
                    <span className={styles.charCount}>{formData.excerpt.length}/300</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="category">Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className={styles.select}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="content">Article Content *</label>
                    <textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      required
                      placeholder="Write your full article content here..."
                      rows={15}
                      className={styles.textarea}
                    />
                    <p className={styles.helpText}>
                      Estimated read time: {formData.content ? calculateReadTime(formData.content) : '0 min read'}
                    </p>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => router.push('/resources')}
                    className={styles.cancelButton}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Article'}
                  </button>
                </div>
              </form>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}

