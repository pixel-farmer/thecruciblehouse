'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from '../styles/Shop.module.css';
import ScrollAnimation from '../components/ScrollAnimation';

export default function ShopPage() {
  const artworks = [
    { id: 'artwork-1', title: 'Artwork Title', medium: 'Medium', year: 'Year', price: '$2,500' },
    { id: 'artwork-2', title: 'Artwork Title', medium: 'Medium', year: 'Year', price: 'Price' },
    { id: 'artwork-3', title: 'Artwork Title', medium: 'Medium', year: 'Year', price: 'Price' },
    { id: 'artwork-4', title: 'Artwork Title', medium: 'Medium', year: 'Year', price: 'Price' },
    { id: 'artwork-5', title: 'Artwork Title', medium: 'Medium', year: 'Year', price: 'Price' },
    { id: 'artwork-6', title: 'Artwork Title', medium: 'Medium', year: 'Year', price: 'Price' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.featured} style={{ paddingTop: '120px' }}>
      <div className={styles.container}>
        <ScrollAnimation>
          <h2 className={styles.sectionTitle}>Shop</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '60px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Browse our collection of available artwork, prints, and exclusive pieces. 
            For inquiries about pricing and availability, please contact us.
          </p>
        </ScrollAnimation>
        <div className={styles.featuredGrid}>
          {artworks.map((artwork, index) => (
            <ScrollAnimation key={artwork.id} delay={index * 0.1}>
              <Link
                href={`/shop/${artwork.id}`}
                className={styles.featuredItemLink}
              >
                <div className={styles.featuredItem}>
                  <div className={styles.featuredImagePlaceholder}>
                    <span>Available Artwork</span>
                  </div>
                  <div className={styles.featuredInfo}>
                    <h3>{artwork.title}</h3>
                    <p>{artwork.medium} • {artwork.year} • {artwork.price}</p>
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

