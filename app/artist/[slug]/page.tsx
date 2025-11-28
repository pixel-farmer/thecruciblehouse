'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '../../styles/Artist.module.css';
import ScrollAnimation from '../../components/ScrollAnimation';

const artists: Record<string, any> = {
  'lawn-walker': {
    name: 'Lawn Walker',
    bio: 'Artist bio and description will go here. This section provides information about the artist\'s background, artistic practice, and inspiration.',
    image: '/BoyBunny1024.JPG',
    artworks: [
      { id: 1, title: 'Artwork Title', medium: 'Medium', year: 'Year' },
      { id: 2, title: 'Artwork Title', medium: 'Medium', year: 'Year' },
      { id: 3, title: 'Artwork Title', medium: 'Medium', year: 'Year' },
    ],
  },
};

export default function ArtistDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const artist = artists[slug];

  if (!artist) {
    notFound();
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
              <div className={styles.aboutImage}>
                <Image
                  src={artist.image}
                  alt={artist.name}
                  width={500}
                  height={500}
                  style={{ width: '100%', height: '500px', objectFit: 'cover' }}
                />
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
          <div className={styles.galleryGrid}>
            {artist.artworks.map((artwork: any, index: number) => (
              <ScrollAnimation key={artwork.id} delay={index * 0.1}>
                <div className={styles.galleryItem} data-category="artwork">
                  <div className={styles.galleryImagePlaceholder}>
                    <span>Artwork {artwork.id}</span>
                  </div>
                  <div className={styles.galleryOverlay}>
                    <h3>{artwork.title}</h3>
                    <p>{artwork.medium} • {artwork.year}</p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

