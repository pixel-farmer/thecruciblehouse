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
                <h1 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '20px' }}>
                  {artist.name}
                </h1>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-light)' }}>
                  {artist.bio}
                </p>
              </div>
              {(artist.gallery_image_url || artist.avatar_url) && (
                <div className={styles.aboutImage}>
                  <Image
                    src={artist.gallery_image_url || artist.avatar_url}
                    alt={artist.name}
                    width={500}
                    height={500}
                    style={{ width: '100%', height: '500px', objectFit: 'cover' }}
                  />
                </div>
              )}
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
                  <div className={styles.galleryItem} data-category="artwork">
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
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
              No artwork available.
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

