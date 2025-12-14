'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '../../styles/Artist.module.css';
import ScrollAnimation from '../../components/ScrollAnimation';

export default function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                <h1 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '10px' }}>
                  {artist.name}
                </h1>
                {locationAndJoinDate && (
                  <p style={{ 
                    fontSize: '0.95rem', 
                    color: 'var(--text-light)', 
                    marginBottom: '20px',
                    fontFamily: 'var(--font-inter)'
                  }}>
                    {locationAndJoinDate}
                  </p>
                )}
                {artist.bio ? (
                  <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-light)' }}>
                    {artist.bio}
                  </p>
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
              <div className={styles.aboutImage}>
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

