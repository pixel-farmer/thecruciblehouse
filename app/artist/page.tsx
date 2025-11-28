'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from '../styles/Gallery.module.css';
import ScrollAnimation from '../components/ScrollAnimation';

export default function ArtistPage() {
  const artists = [
    {
      id: 'lawn-walker',
      name: 'Lawn Walker',
      image: '/BoyBunny1024.JPG',
      thumbnail: '/BoyBunny1024.JPG',
    },
    {
      id: 'artist-2',
      name: 'Artist Name',
      image: null,
      thumbnail: null,
    },
    {
      id: 'artist-3',
      name: 'Artist Name',
      image: null,
      thumbnail: null,
    },
  ];

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
        <div className={styles.galleryGrid}>
          {artists.map((artist, index) => (
            <ScrollAnimation key={artist.id} delay={index * 0.1}>
              <Link
                href={`/artist/${artist.id}`}
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
      </div>
    </section>
    </motion.div>
  );
}

