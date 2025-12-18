'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '@/app/components/ScrollAnimation';
import styles from '../../styles/Commissions.module.css';

interface OpenCall {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  deadline: string;
  city: string | null;
  state: string | null;
  country: string | null;
  is_remote: boolean;
  prizes: string | null;
  application_fee: number;
  fee_currency: string;
  view_count: number;
  contact_email: string;
  gallery_name: string | null;
  website: string;
  header_image: string | null;
  organizer_name: string;
  created_at: string;
  owner: {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
    slug: string;
  };
}

export default function OpenCallDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [openCall, setOpenCall] = useState<OpenCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSignInMessage, setShowSignInMessage] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOpenCall();
      checkUser();
    }
  }, [id]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchOpenCall = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, increment view count
      await fetch(`/api/open-calls/${id}/view`, {
        method: 'POST',
      });

      // Then fetch the open call details
      const response = await fetch(`/api/open-calls/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch open call');
      }

      setOpenCall(data.openCall);
    } catch (err: any) {
      console.error('Failed to fetch open call:', err);
      setError(err.message || 'Failed to load open call');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  };

  const handleApplyClick = async () => {
    if (!openCall) return;
    
    // Check if user is signed in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setShowSignInMessage(true);
      return;
    }
    
    // Open the website in a new tab
    window.open(openCall.website, '_blank', 'noopener,noreferrer');
  };

  const handleEditClick = () => {
    if (openCall) {
      router.push(`/open-calls/edit/${openCall.id}`);
    }
  };

  const handleDeleteClick = async () => {
    if (!openCall) return;
    
    if (!confirm('Are you sure you want to delete this open call? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setShowSignInMessage(true);
        return;
      }

      const response = await fetch(`/api/open-calls?id=${openCall.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete open call');
      }

      // Redirect to listing page
      router.push('/open-calls');
    } catch (err: any) {
      console.error('Error deleting open call:', err);
      alert(err.message || 'Failed to delete open call');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
        Loading...
      </div>
    );
  }

  if (error || !openCall) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
        {error || 'Open call not found'}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.commissions} style={{ paddingTop: '120px', paddingBottom: '100px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div style={{ marginBottom: '30px' }}>
              <Link 
                href="/open-calls"
                style={{
                  color: 'var(--accent-color)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                ← Back to Open Calls
              </Link>
            </div>
          </ScrollAnimation>

          <ScrollAnimation>
            <div className={styles.commissionCard} style={{ maxWidth: '900px', margin: '0 auto' }}>
              {openCall.header_image && (
                <div style={{ 
                  width: '100%', 
                  height: '400px', 
                  marginBottom: '30px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Image
                    src={openCall.header_image}
                    alt={openCall.title}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}
              
              <div className={styles.commissionHeader} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h1 className={styles.commissionTitle} style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
                    {openCall.title}
                  </h1>
                  <span className={styles.commissionPosted}>
                    Posted {formatTimeAgo(openCall.created_at)}
                  </span>
                </div>
                <Link 
                  href={`/artist/${openCall.owner.slug}`}
                  style={{ 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    color: 'inherit',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {openCall.owner.avatar && openCall.owner.avatar.startsWith('http') ? (
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={openCall.owner.avatar}
                        alt={openCall.owner.name || 'Owner'}
                        width={50}
                        height={50}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-color)',
                      color: 'var(--white)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}>
                      {openCall.owner.initials || 'U'}
                    </div>
                  )}
                </Link>
              </div>

              <div className={styles.commissionMeta} style={{ marginBottom: '20px' }}>
                <span className={styles.commissionClient} style={{ margin: 0, fontSize: '1rem' }}>
                  {openCall.gallery_name || openCall.owner.name}
                </span>
                <span className={styles.commissionCategory}>{openCall.category}</span>
                <span className={styles.commissionType}>{openCall.type}</span>
                {openCall.is_remote && (
                  <span className={styles.commissionType} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                    Remote
                  </span>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px', 
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: 'var(--secondary-color)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <strong style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Deadline:
                    </strong>
                    <p style={{ margin: '5px 0 0 0', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 600 }}>
                      {formatDate(openCall.deadline)}
                    </p>
                  </div>
                  <div>
                    <strong style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Views:
                    </strong>
                    <p style={{ margin: '5px 0 0 0', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 600 }}>
                      {openCall.view_count || 0}
                    </p>
                  </div>
                  {openCall.application_fee > 0 && (
                    <div>
                      <strong style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        Application Fee:
                      </strong>
                      <p style={{ margin: '5px 0 0 0', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 600 }}>
                        {openCall.fee_currency === 'USD' ? '$' : openCall.fee_currency} {openCall.application_fee.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {openCall.application_fee === 0 && (
                    <div>
                      <strong style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        Application Fee:
                      </strong>
                      <p style={{ margin: '5px 0 0 0', fontFamily: 'var(--font-inter)', fontSize: '1rem', fontWeight: 600, color: '#4CAF50' }}>
                        Free
                      </p>
                    </div>
                  )}
                </div>
                {[openCall.city, openCall.state, openCall.country].filter(Boolean).length > 0 && (
                  <div>
                    <strong style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Location:
                    </strong>
                    <p style={{ margin: '5px 0 0 0', fontFamily: 'var(--font-inter)', fontSize: '1rem' }}>
                      {[openCall.city, openCall.state, openCall.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {openCall.prizes && (
                  <div>
                    <strong style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Prizes/Awards:
                    </strong>
                    <p style={{ margin: '5px 0 0 0', fontFamily: 'var(--font-inter)', fontSize: '1rem' }}>
                      {openCall.prizes}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '30px' }}>
                <h2 style={{ 
                  fontFamily: 'var(--font-inter)', 
                  fontSize: '1.5rem', 
                  fontWeight: 600, 
                  marginBottom: '15px',
                  color: 'var(--primary-color)'
                }}>
                  Description
                </h2>
                <p className={styles.commissionDescription} style={{ 
                  fontSize: '1.1rem', 
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap'
                }}>
                  {openCall.description}
                </p>
              </div>

              <div className={styles.commissionFooter} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {currentUserId && currentUserId === openCall.owner.id && (
                    <>
                      <button
                        onClick={handleEditClick}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: 'var(--white)',
                          color: 'var(--primary-color)',
                          border: '1px solid var(--primary-color)',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'var(--font-inter)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                          e.currentTarget.style.color = 'var(--white)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--white)';
                          e.currentTarget.style.color = 'var(--primary-color)';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        disabled={deleting}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: deleting ? 'var(--text-light)' : '#ef4444',
                          color: 'var(--white)',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          fontWeight: 500,
                          cursor: deleting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          fontFamily: 'var(--font-inter)',
                          opacity: deleting ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!deleting) {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!deleting) {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                          }
                        }}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
                <button 
                  className={styles.applyButton}
                  onClick={handleApplyClick}
                  style={{ fontSize: '1.1rem', padding: '12px 30px' }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Sign In Message Modal */}
      {showSignInMessage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowSignInMessage(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#333',
            }}>
              Sign In Required
            </h3>
            <p style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              color: '#666',
              marginBottom: '1.5rem',
            }}>
              Please sign in to apply for this open call.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSignInMessage(false)}
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <Link
                href="/login"
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: '#ff6622',
                  color: 'white',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e55a1a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6622';
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
