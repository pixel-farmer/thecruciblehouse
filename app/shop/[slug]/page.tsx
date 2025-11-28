'use client';

import Image from 'next/image';
import { use } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from '../../styles/ArtworkDetail.module.css';
import ScrollAnimation from '../../components/ScrollAnimation';

const artworks: Record<string, any> = {
  'artwork-1': {
    title: 'Artwork Title',
    artist: 'Artist Name',
    price: '$2,500',
    size: '24" × 36"',
    medium: 'Oil on Canvas',
    year: '2024',
    description: 'This is a detailed description of the artwork. It provides insight into the artist\'s inspiration, technique, and the meaning behind the piece.',
    image: null,
  },
  'artwork-2': {
    title: 'Artwork Title',
    artist: 'Artist Name',
    price: 'Price',
    size: '24" × 36"',
    medium: 'Medium',
    year: 'Year',
    description: 'This is a detailed description of the artwork. It provides insight into the artist\'s inspiration, technique, and the meaning behind the piece.',
    image: null,
  },
  'artwork-3': {
    title: 'Artwork Title',
    artist: 'Artist Name',
    price: 'Price',
    size: '24" × 36"',
    medium: 'Medium',
    year: 'Year',
    description: 'This is a detailed description of the artwork. It provides insight into the artist\'s inspiration, technique, and the meaning behind the piece.',
    image: null,
  },
  'artwork-4': {
    title: 'Artwork Title',
    artist: 'Artist Name',
    price: 'Price',
    size: '24" × 36"',
    medium: 'Medium',
    year: 'Year',
    description: 'This is a detailed description of the artwork. It provides insight into the artist\'s inspiration, technique, and the meaning behind the piece.',
    image: null,
  },
  'artwork-5': {
    title: 'Artwork Title',
    artist: 'Artist Name',
    price: 'Price',
    size: '24" × 36"',
    medium: 'Medium',
    year: 'Year',
    description: 'This is a detailed description of the artwork. It provides insight into the artist\'s inspiration, technique, and the meaning behind the piece.',
    image: null,
  },
  'artwork-6': {
    title: 'Artwork Title',
    artist: 'Artist Name',
    price: 'Price',
    size: '24" × 36"',
    medium: 'Medium',
    year: 'Year',
    description: 'This is a detailed description of the artwork. It provides insight into the artist\'s inspiration, technique, and the meaning behind the piece.',
    image: null,
  },
};

export default function ArtworkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const artwork = artworks[slug];

  if (!artwork) {
    notFound();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.artworkDetail} style={{ paddingTop: '120px', paddingBottom: '100px' }}>
      <div className={styles.container}>
        <ScrollAnimation>
          <div className={styles.artworkDetailContent}>
            <div className={styles.artworkInfo}>
              <h1 className={styles.artworkTitle}>{artwork.title}</h1>
              <p className={styles.artworkArtist}>By {artwork.artist}</p>
              <div className={styles.artworkPrice}>{artwork.price}</div>
              
              <div className={styles.artworkDetails}>
                <div className={styles.detailItem}>
                  <strong>Size:</strong>
                  <span>{artwork.size}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Medium:</strong>
                  <span>{artwork.medium}</span>
                </div>
                <div className={styles.detailItem}>
                  <strong>Year:</strong>
                  <span>{artwork.year}</span>
                </div>
              </div>

              <div className={styles.artworkDescription}>
                <h3>Description</h3>
                <p>{artwork.description}</p>
              </div>

              <button className={styles.buyButton}>Buy Now</button>
            </div>

            <div className={styles.artworkImageContainer}>
              {artwork.image ? (
                <Image
                  src={artwork.image}
                  alt={artwork.title}
                  width={800}
                  height={600}
                  className={styles.artworkMainImage}
                />
              ) : (
                <div className={styles.artworkImagePlaceholder}>
                  <span>Artwork Image</span>
                </div>
              )}
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
    </motion.div>
  );
}

