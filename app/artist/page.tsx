'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from '../styles/Gallery.module.css';
import ScrollAnimation from '../components/ScrollAnimation';

export default function ArtistPage() {
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await fetch('/api/artists');
        if (response.ok) {
          const data = await response.json();
          setArtists(data.artists || []);
        }
      } catch (error) {
        console.error('Error fetching artists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.gallery} style={{ paddingTop: '120px' }}>
      <div className={styles.container}>
        <ScrollAnimation>
          <h2 className={styles.sectionTitle}>Artists</h2>
        </ScrollAnimation>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            Loading artists...
          </div>
        ) : artists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
            No artists found.
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {artists.map((artist, index) => (
              <ScrollAnimation key={artist.id} delay={index * 0.1}>
                <Link
                  href={`/artist/${artist.slug}`}
                  className={styles.galleryItemLink}
                >
                  <div className={styles.galleryItem}>
                    {artist.thumbnail ? (
                      <Image
                        src={artist.thumbnail}
                        alt={artist.name}
                        width={1024}
                        height={1024}
                        className={styles.galleryImage}
                      />
                    ) : (
                      <div className={styles.galleryImagePlaceholder}>
                        <span>Artist</span>
                      </div>
                    )}
                    <div className={styles.galleryOverlay}>
                      <h3>{artist.name}</h3>
                      <p>View Artwork →</p>
                    </div>
                  </div>
                </Link>
              </ScrollAnimation>
            ))}
          </div>
        )}
      </div>
    </section>
    </motion.div>
  );
}

