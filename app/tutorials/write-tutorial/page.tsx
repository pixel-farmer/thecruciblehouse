'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '@/app/components/ScrollAnimation';
import styles from '../../resources/write-article/WriteArticle.module.css';

interface UploadedImage {
  url: string;
  preview: string;
  name: string;
}

export default function WriteTutorialPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

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
    category: 'Tutorials',
    content: '',
  });

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

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('You must be logged in to upload images');
      return;
    }

    setError(null);
    setUploadingImage(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        // Create preview
        const preview = URL.createObjectURL(file);

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `tutorials/${session.user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to get URL for ${file.name}`);
        }

        return {
          url: urlData.publicUrl,
          preview,
          name: file.name,
        };
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...uploaded]);
    } catch (err: any) {
      console.error('Image upload error:', err);
      setError(err.message || 'Failed to upload image(s)');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Insert image markdown at cursor position
  const insertImageAtCursor = (imageUrl: string, imageName: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const imageMarkdown = `\n\n![${imageName}](${imageUrl})\n\n`;
    
    const newText = text.substring(0, start) + imageMarkdown + text.substring(end);
    setFormData(prev => ({ ...prev, content: newText }));

    // Set cursor position after inserted image
    setTimeout(() => {
      const newCursorPos = start + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Remove uploaded image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        setError('You must be logged in to post a tutorial.');
        setIsSubmitting(false);
        return;
      }

      const userMetadata = session.user.user_metadata || {};
      const membershipStatus = userMetadata.membership_status;
      const hasPaidMembership = userMetadata.has_paid_membership;
      const isFounder = userMetadata.is_founder === true;
      const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;

      if (!isPro) {
        setError('Pro membership required to post tutorials. Please upgrade your membership.');
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
          category: 'Tutorials', // Always set to Tutorials
          content: formData.content,
          author,
          readTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to post tutorial';
        const errorDetails = data.details ? ` ${data.details}` : '';
        const errorCode = data.code ? ` (Code: ${data.code})` : '';
        throw new Error(`${errorMessage}${errorDetails}${errorCode}`);
      }

      setSuccess(true);
      
      // Redirect to tutorials page after 2 seconds
      setTimeout(() => {
        router.push('/tutorials');
      }, 2000);
    } catch (err: any) {
      console.error('Error posting tutorial:', err);
      setError(err.message || 'An error occurred while posting your tutorial. Please try again.');
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
              <h1 className={styles.mainTitle}>Post a Tutorial</h1>
              <p className={styles.subtitle}>
                Share your expertise and help fellow artists learn new techniques. Create a step-by-step tutorial that guides artists through a process or teaches a new skill.
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className={styles.formContainer}>
              {success && (
                <div className={styles.successMessage}>
                  <p>✓ Your tutorial has been posted successfully! Redirecting to Tutorials page...</p>
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  <p>✗ {error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Tutorial Details</h2>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="title">Tutorial Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., How to Create Digital Art Portraits"
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
                      placeholder="Write a brief summary of your tutorial that will appear in the tutorial list..."
                      rows={3}
                      className={styles.textarea}
                      maxLength={300}
                    />
                    <span className={styles.charCount}>{formData.excerpt.length}/300</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="content">Tutorial Content *</label>
                    <textarea
                      ref={contentTextareaRef}
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      required
                      placeholder="Write your step-by-step tutorial content here. Break it down into clear, easy-to-follow steps..."
                      rows={15}
                      className={styles.textarea}
                    />
                    <p className={styles.helpText}>
                      Estimated read time: {formData.content ? calculateReadTime(formData.content) : '0 min read'}
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Tutorial Images</label>
                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-light)',
                      marginBottom: '10px',
                      fontFamily: 'var(--font-inter)'
                    }}>
                      Upload images to include in your tutorial. Click "Insert Image" to add them at your cursor position in the content above.
                    </p>
                    
                    {uploadedImages.length > 0 && (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                        gap: '15px',
                        marginBottom: '15px'
                      }}>
                        {uploadedImages.map((img, index) => (
                          <div key={index} style={{
                            position: 'relative',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--white)',
                          }}>
                            <div style={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
                              <Image
                                src={img.preview}
                                alt={img.name}
                                fill
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                            <div style={{ padding: '8px' }}>
                              <p style={{ 
                                fontSize: '0.75rem', 
                                color: 'var(--text-light)',
                                margin: '0 0 8px 0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'var(--font-inter)'
                              }}>
                                {img.name}
                              </p>
                              <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                <button
                                  type="button"
                                  onClick={() => insertImageAtCursor(img.url, img.name)}
                                  style={{
                                    padding: '6px 10px',
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'var(--white)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    fontFamily: 'var(--font-inter)',
                                    width: '100%',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#e55a1a';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                                  }}
                                >
                                  Insert Image
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  style={{
                                    padding: '6px 10px',
                                    backgroundColor: 'var(--secondary-color)',
                                    color: 'var(--text-dark)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    fontFamily: 'var(--font-inter)',
                                    width: '100%',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'var(--secondary-color)',
                        color: 'var(--text-dark)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        cursor: uploadingImage ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        fontFamily: 'var(--font-inter)',
                        transition: 'all 0.3s ease',
                        opacity: uploadingImage ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!uploadingImage) {
                          e.currentTarget.style.backgroundColor = 'var(--accent-color)';
                          e.currentTarget.style.color = 'var(--white)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!uploadingImage) {
                          e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                          e.currentTarget.style.color = 'var(--text-dark)';
                        }
                      }}
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Images'}
                    </button>
                    <p style={{ 
                      marginTop: '5px', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-light)',
                      fontFamily: 'var(--font-inter)'
                    }}>
                      You can upload multiple images at once (max 5MB each)
                    </p>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => router.push('/tutorials')}
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
                    {isSubmitting ? 'Posting...' : 'Post Tutorial'}
                  </button>
                </div>
              </form>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
