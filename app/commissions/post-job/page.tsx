'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '@/app/components/ScrollAnimation';
import styles from './PostJob.module.css';

export default function PostJobPage() {
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
    description: '',
    category: '',
    type: '',
    budgetMin: '',
    budgetMax: '',
    location: '',
    isRemote: false,
    deadline: '',
    contactEmail: '',
    contactPhone: '',
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

  const commissionTypes = [
    'Personal',
    'Commercial',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('You must be logged in to post a job.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to post job. Please try again.';
        const errorDetails = data.details ? ` ${data.details}` : '';
        const errorCode = data.code ? ` (Code: ${data.code})` : '';
        throw new Error(`${errorMessage}${errorDetails}${errorCode}`);
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/commissions');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to post job. Please try again.');
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
              <h1 className={styles.mainTitle}>Post a Job</h1>
              <p className={styles.subtitle}>
                Create a commission listing to connect with talented artists. 
                Fill out the form below to post your job opportunity.
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className={styles.formContainer}>
              {success && (
                <div className={styles.successMessage}>
                  <p>Your job posting has been submitted successfully! Redirecting...</p>
                </div>
              )}

              {error && (
                <div className={styles.errorMessage}>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Job Details</h2>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="title">Job Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Custom Portrait Commission"
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
                      placeholder="Describe the commission in detail..."
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
                        {commissionTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Budget & Location</h2>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="budgetMin">Budget Minimum ($) *</label>
                      <input
                        type="number"
                        id="budgetMin"
                        name="budgetMin"
                        value={formData.budgetMin}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="500"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="budgetMax">Budget Maximum ($) *</label>
                      <input
                        type="number"
                        id="budgetMax"
                        name="budgetMax"
                        value={formData.budgetMax}
                        onChange={handleChange}
                        required
                        min="0"
                        placeholder="1000"
                        className={styles.input}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City, State or Country"
                      className={styles.input}
                    />
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
                      <span>Remote work accepted</span>
                    </label>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Additional Information</h2>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="deadline">Deadline (Optional)</label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="contactEmail">Contact Email *</label>
                      <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="contactPhone">Contact Phone (Optional)</label>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className={styles.input}
                      />
                    </div>
                  </div>
                </div>

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
                    {isSubmitting ? 'Submitting...' : 'Post Job'}
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

