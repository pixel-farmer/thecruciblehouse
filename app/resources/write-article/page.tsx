'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '@/app/components/ScrollAnimation';
import styles from './WriteArticle.module.css';

export default function WriteArticlePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check membership on page load
  useEffect(() => {
    const checkMembership = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.user) {
          router.push('/login');
          return;
        }

        const userMetadata = session.user.user_metadata || {};
        const membershipStatus = userMetadata.membership_status;
        const hasPaidMembership = userMetadata.has_paid_membership;
        const isFounder = userMetadata.is_founder === true;
        const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;

        if (!isPro) {
          router.push('/pricing');
          return;
        }

        setCheckingAccess(false);
      } catch (error) {
        console.error('Error checking membership:', error);
        router.push('/pricing');
      }
    };

    checkMembership();
  }, [router]);

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
    'Digital',
  ];

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
        setError('You must be logged in to post an article.');
        setIsSubmitting(false);
        return;
      }

      const userMetadata = session.user.user_metadata || {};
      const membershipStatus = userMetadata.membership_status || userMetadata.has_paid_membership;
      const isPro = !!membershipStatus;

      if (!isPro) {
        setError('Pro membership required to post articles. Please upgrade your membership.');
        setIsSubmitting(false);
        return;
      }

      const author = userMetadata.display_name || 
                    userMetadata.full_name || 
                    userMetadata.name || 
                    session.user.email?.split('@')[0] || 
                    'Anonymous';

      const readTime = calculateReadTime(formData.content);

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          category: formData.category,
          content: formData.content,
          author,
          readTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to post article';
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
      console.error('Error posting article:', err);
      setError(err.message || 'An error occurred while posting your article. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className={styles.postArticle}>
        <div className={styles.container}>
          <div className={styles.loading}>Checking access...</div>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.postArticle} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div className={styles.header}>
              <h1 className={styles.mainTitle}>Post an Article</h1>
              <p className={styles.subtitle}>
                Share your knowledge and insights with the art community. Write an article that will help fellow artists grow and learn.
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className={styles.formContainer}>
              {success && (
                <div className={styles.successMessage}>
                  <p>✓ Your article has been posted successfully! Redirecting to Resources page...</p>
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
                    {isSubmitting ? 'Posting...' : 'Post Article'}
                  </button>
                </div>
              </form>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}

