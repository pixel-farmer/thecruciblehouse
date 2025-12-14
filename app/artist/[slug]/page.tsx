'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import styles from '../../styles/Artist.module.css';
import ScrollAnimation from '../../components/ScrollAnimation';
import ProBadge from '../../components/ProBadge';

export default function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const response = await fetch(`/api/artists/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setArtist(data.artist);
        } else if (response.status === 404) {
          router.push('/artist');
        }
      } catch (error) {
        console.error('Error fetching artist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [slug, router]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>Loading...</div>
      </div>
    );
  }

  if (!artist) {
    return null;
  }

  // Format join date
  const formatJoinDate = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting join date:', error);
      return '';
    }
  };

  // Build location string from public fields
  const locationParts: string[] = [];
  if (artist.city) locationParts.push(artist.city);
  if (artist.state) locationParts.push(artist.state);
  if (artist.country) locationParts.push(artist.country);
  const location = locationParts.join(', ');
  const joinDate = formatJoinDate(artist.created_at);
  const locationAndJoinDate = [location, joinDate ? `Joined ${joinDate}` : '']
    .filter(Boolean)
    .join(' • ');

  // Handle starting a conversation
  const handleStartConversation = async () => {
    try {
      setIsStartingConversation(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        router.push('/login');
        return;
      }

      // Don't allow messaging yourself
      if (session.user.id === artist.id) {
        return;
      }

      // Create or get existing conversation
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ otherUserId: artist.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to messages page with conversation ID to auto-open it
        router.push(`/messages?conversation=${data.conversation.id}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to start conversation:', errorData);
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsStartingConversation(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.about} style={{ paddingTop: '120px', paddingBottom: '60px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <div className={styles.aboutContent} style={{ marginBottom: '40px' }}>
              <div className={styles.aboutText}>
                <div style={{ marginBottom: '20px' }}>
                  <h1 style={{ 
                    fontFamily: 'var(--font-playfair), serif',
                    fontSize: '3rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    marginBottom: '10px',
                    color: 'var(--primary-color)'
                  }}>
                    {artist.name}
                  </h1>
                  {artist.discipline && (
                    <div style={{ 
                      fontSize: '0.95rem', 
                      color: 'var(--text-light)', 
                      marginBottom: '5px',
                      fontFamily: 'var(--font-inter)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{artist.discipline}</span>
                      {currentUserId && currentUserId !== artist.id && (
                        <button
                          onClick={handleStartConversation}
                          disabled={isStartingConversation}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: isStartingConversation ? 'wait' : 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isStartingConversation ? 0.6 : 1,
                            transition: 'opacity 0.2s ease',
                            color: 'var(--text-light)',
                          }}
                          onMouseEnter={(e) => {
                            if (!isStartingConversation) {
                              e.currentTarget.style.opacity = '0.7';
                              e.currentTarget.style.color = 'var(--accent-color)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = isStartingConversation ? '0.6' : '1';
                            e.currentTarget.style.color = 'var(--text-light)';
                          }}
                          aria-label="Start conversation"
                          title="Send a message"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '0.95rem', 
                    color: 'var(--text-light)', 
                    marginBottom: '15px',
                    fontFamily: 'var(--font-inter)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {locationAndJoinDate && <span>{locationAndJoinDate}</span>}
                    {artist.isPro && (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        position: 'relative',
                        width: '14px',
                        height: '14px'
                      }}>
                        <span style={{
                          position: 'relative',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: '#ff6622',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}>
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </span>
                      </span>
                    )}
                  </div>
                  <div style={{
                    width: '60px',
                    height: '3px',
                    backgroundColor: 'var(--accent-color)',
                    marginTop: '5px'
                  }}></div>
                </div>
                {artist.bio ? (
                  <>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-light)', marginBottom: artist.portfolio_url ? '16px' : '0' }}>
                      {artist.bio}
                    </p>
                    {artist.portfolio_url && (
                      <a 
                        href={artist.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          color: '#ff6622',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-inter)',
                          textDecoration: 'none',
                          transition: 'text-decoration 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {artist.portfolio_url.replace(/^https?:\/\//i, '')}
                      </a>
                    )}
                  </>
                ) : artist.portfolio_url ? (
                  <a 
                    href={artist.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      color: '#ff6622',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-inter)',
                      textDecoration: 'none',
                      transition: 'text-decoration 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {artist.portfolio_url.replace(/^https?:\/\//i, '')}
                  </a>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '150px',
                    backgroundColor: '#e8e8e8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-light)',
                    fontSize: '0.95rem',
                    fontFamily: 'var(--font-inter)'
                  }}>
                    No bio available
                  </div>
                )}
              </div>
              <div className={styles.aboutImage} style={{ position: 'relative' }}>
                {artist.gallery_image_url || artist.avatar_url ? (
                  <Image
                    src={artist.gallery_image_url || artist.avatar_url}
                    alt={artist.name}
                    width={500}
                    height={500}
                    style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '500px',
                    backgroundColor: '#e8e8e8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-light)',
                    fontSize: '1.1rem',
                    fontFamily: 'var(--font-inter)'
                  }}>
                    No image available
                  </div>
                )}
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      <section className={styles.gallery}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Artwork</h2>
          </ScrollAnimation>
          {artist.artwork && artist.artwork.length > 0 ? (
            <div className={styles.galleryGrid}>
              {artist.artwork.map((artwork: any, index: number) => (
                <ScrollAnimation key={artwork.id} delay={index * 0.1}>
                  <div 
                    className={styles.galleryItem} 
                    data-category="artwork"
                    onClick={() => artwork.image_url && setSelectedImage(artwork.image_url)}
                  >
                    {artwork.image_url ? (
                      <Image
                        src={artwork.image_url}
                        alt={artwork.title || 'Artwork'}
                        width={1024}
                        height={1024}
                        className={styles.galleryImage}
                      />
                    ) : (
                      <div className={styles.galleryImagePlaceholder}>
                        <span>Artwork</span>
                      </div>
                    )}
                    <div className={styles.galleryOverlay}>
                      {artwork.title && <h3>{artwork.title}</h3>}
                      {artwork.medium && <p>{artwork.medium}</p>}
                    </div>
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          ) : (
            <div className={styles.galleryGrid}>
              {/* Show 6 placeholder boxes when no artwork */}
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className={styles.galleryItem} style={{ cursor: 'default' }}>
                  <div className={styles.galleryImagePlaceholder}>
                    <span style={{ opacity: 0.5 }}>No artwork</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className={styles.lightboxOverlay}
          onClick={() => setSelectedImage(null)}
        >
          <button
            className={styles.lightboxClose}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="Close lightbox"
          >
            ×
          </button>
          <div 
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt="Artwork"
              width={1920}
              height={1080}
              className={styles.lightboxImage}
              unoptimized
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

