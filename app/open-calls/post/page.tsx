'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '@/app/components/ScrollAnimation';
import styles from '../../commissions/post-job/PostJob.module.css';

export default function PostOpenCallPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [userInfo, setUserInfo] = useState<{
    name: string;
    avatar: string | null;
    initials: string;
    email: string;
  } | null>(null);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check membership on page load and get user info
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

        // Get user info for display
        const email = session.user.email || '';
        const displayName = userMetadata.display_name ||
                           userMetadata.full_name ||
                           userMetadata.name ||
                           email.split('@')[0] ||
                           'User';
        
        const avatar = userMetadata.avatar_url || 
                      userMetadata.picture || 
                      null;

        // Get initials for avatar
        let initials = 'U';
        if (displayName && displayName !== email.split('@')[0]) {
          const nameParts = displayName.split(' ').filter((part: string) => part.length > 0);
          if (nameParts.length >= 2) {
            initials = `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
          } else if (nameParts.length === 1 && nameParts[0].length > 0) {
            initials = nameParts[0][0].toUpperCase();
          }
        } else if (email && email.length > 0) {
          initials = email[0].toUpperCase();
        }

        setUserInfo({
          name: displayName,
          avatar,
          initials,
          email,
        });

        // Set contact email in form data (from user's account)
        setFormData(prev => ({ ...prev, contactEmail: email }));

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
    description: '',
    category: '',
    type: '',
    city: '',
    state: '',
    country: '',
    isRemote: false,
    deadline: '',
    prizes: '',
    applicationFee: '',
    feeCurrency: 'USD',
    contactEmail: '',
    galleryName: '',
    website: '',
    headerImage: '',
  });

  const categories = [
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

  const callTypes = [
    'Exhibition',
    'Residency',
    'Competition',
    'Grant',
    'Publication',
    'Other',
  ];

  const currencies = [
    'USD',
    'EUR',
    'GBP',
    'CAD',
    'AUD',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle header image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeaderPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setError(null);
    setUploadingImage(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to upload images');
        setUploadingImage(false);
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `open-calls/${session.user.id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload image. Please try again.');
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setHeaderImage(urlData.publicUrl);
        setFormData(prev => ({ ...prev, headerImage: urlData.publicUrl }));
      } else {
        setError('Failed to get image URL');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('You must be logged in to post an open call.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/open-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        console.log('Response status:', response.status);
        
        if (!responseText || responseText.trim() === '') {
          console.error('Empty response body from server');
          throw new Error(`Server returned empty response (${response.status} ${response.statusText}). Check server logs for details.`);
        }
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON:', parseError);
          console.error('Response text was:', responseText);
          throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}`);
        }
      } catch (jsonError) {
        console.error('Error processing response:', jsonError);
        throw jsonError instanceof Error ? jsonError : new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        const errorMessage = data?.error || 'Failed to post open call. Please try again.';
        const errorDetails = data?.details ? ` ${data.details}` : '';
        const errorCode = data?.code ? ` (Code: ${data.code})` : '';
        throw new Error(`${errorMessage}${errorDetails}${errorCode}`);
      }
      
      // Redirect immediately to the detail page of the newly created open call
      if (data?.openCall?.id) {
        router.push(`/open-calls/${data.openCall.id}`);
      } else {
        // Fallback: redirect to listing page if ID is not available
        setSuccess(true);
        setTimeout(() => {
          router.push('/open-calls');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to post open call. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAccess) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
        Loading...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.postJob} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div className={styles.header}>
              <h1 className={styles.mainTitle}>Post an Open Call</h1>
              <p className={styles.subtitle}>
                Share your exhibition opportunity, residency, competition, grant, or publication call. 
                Fill out the form below to post your open call.
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className={styles.formContainer}>
              {success && (
                <div className={styles.successMessage}>
                  <p>Your open call has been submitted successfully! Redirecting...</p>
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Open Call Details</h2>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="headerImage">Header Image (Optional)</label>
                    <div style={{ marginBottom: '10px' }}>
                      {headerPreview || headerImage ? (
                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                          <Image
                            src={headerPreview || headerImage || ''}
                            alt="Header preview"
                            width={800}
                            height={300}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '300px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setHeaderImage(null);
                              setHeaderPreview(null);
                              setFormData(prev => ({ ...prev, headerImage: '' }));
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              padding: '6px 12px',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontFamily: 'var(--font-inter)',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="headerImage"
                        name="headerImage"
                        accept="image/*"
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
                        {uploadingImage ? 'Uploading...' : headerImage || headerPreview ? 'Change Image' : 'Upload Header Image'}
                      </button>
                      <p style={{ 
                        marginTop: '5px', 
                        fontSize: '0.85rem', 
                        color: 'var(--text-light)',
                        fontFamily: 'var(--font-inter)'
                      }}>
                        Recommended size: 800x300px (max 5MB)
                      </p>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="title">Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., BBA Artist Prize 2026"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="description">Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      placeholder="Describe the open call in detail..."
                      rows={6}
                      className={styles.textarea}
                    />
                  </div>

                  <div className={styles.formRow}>
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
                      <label htmlFor="type">Type *</label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className={styles.select}
                      >
                        <option value="">Select a type</option>
                        {callTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Location & Deadline</h2>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g., Berlin"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="state">State/Province</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g., Brandenburg"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="country">Country</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="e.g., Germany"
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isRemote"
                        checked={formData.isRemote}
                        onChange={handleChange}
                        className={styles.checkbox}
                      />
                      <span>Remote/Online opportunity</span>
                    </label>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="deadline">Deadline *</label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      required
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Prizes & Fees</h2>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="prizes">Prizes/Awards (Optional)</label>
                    <input
                      type="text"
                      id="prizes"
                      name="prizes"
                      value={formData.prizes}
                      onChange={handleChange}
                      placeholder="e.g., BBA Prizes, $10,000 Grand Prize"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="applicationFee">Application Fee</label>
                      <input
                        type="number"
                        id="applicationFee"
                        name="applicationFee"
                        value={formData.applicationFee}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="feeCurrency">Currency</label>
                      <select
                        id="feeCurrency"
                        name="feeCurrency"
                        value={formData.feeCurrency}
                        onChange={handleChange}
                        className={styles.select}
                      >
                        {currencies.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Contact Information</h2>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="website">Website *</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        required
                        placeholder="https://example.com"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="galleryName">Gallery Name</label>
                      <input
                        type="text"
                        id="galleryName"
                        name="galleryName"
                        value={formData.galleryName}
                        onChange={handleChange}
                        placeholder="e.g., BBA Gallery"
                        className={styles.input}
                      />
                    </div>
                  </div>
                  <p style={{ 
                    marginTop: '5px', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-light)',
                    fontFamily: 'var(--font-inter)'
                  }}>
                    Artists will be directed to this website when they click "Apply"
                  </p>
                </div>

                {userInfo && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '15px',
                    backgroundColor: 'var(--secondary-color)',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    {userInfo.avatar && userInfo.avatar.startsWith('http') ? (
                      <div style={{ position: 'relative' }}>
                        <Image
                          src={userInfo.avatar}
                          alt={userInfo.name || 'User'}
                          width={48}
                          height={48}
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-color)',
                        color: 'var(--white)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        flexShrink: 0,
                      }}>
                        {userInfo.initials || 'U'}
                      </div>
                    )}
                    <div>
                      <p style={{ 
                        margin: 0, 
                        fontWeight: 600, 
                        color: 'var(--text-dark)',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-inter)'
                      }}>
                        {userInfo.name}
                      </p>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.85rem', 
                        color: 'var(--text-light)',
                        fontFamily: 'var(--font-inter)'
                      }}>
                        Posting as this account
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={() => router.back()}
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
                    {isSubmitting ? 'Submitting...' : 'Post Open Call'}
                  </button>
                </div>
              </form>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </motion.div>
  );
}
