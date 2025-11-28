'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './styles/Home.module.css';
import ScrollAnimation from './components/ScrollAnimation';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.hero}>
        <ScrollAnimation>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>The Crucible House</h1>
            <p className={styles.heroSubtitle}>Where Art is Forged</p>
            <Link href="/artist" className={styles.ctaButton}>
              View Artists
            </Link>
          </div>
        </ScrollAnimation>
      </section>

      <section className={styles.featured}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Featured Works</h2>
          </ScrollAnimation>
          <div className={styles.featuredGrid}>
            <ScrollAnimation delay={0.1}>
              <div className={styles.featuredItem}>
                <div className={styles.featuredImagePlaceholder}>
                  <span>Featured Artwork</span>
                </div>
                <div className={styles.featuredInfo}>
                  <h3>Artwork Title</h3>
                  <p>Medium • Year</p>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation delay={0.2}>
              <div className={styles.featuredItem}>
                <div className={styles.featuredImagePlaceholder}>
                  <span>Featured Artwork</span>
                </div>
                <div className={styles.featuredInfo}>
                  <h3>Artwork Title</h3>
                  <p>Medium • Year</p>
                </div>
              </div>
            </ScrollAnimation>
            <ScrollAnimation delay={0.3}>
              <div className={styles.featuredItem}>
                <div className={styles.featuredImagePlaceholder}>
                  <span>Featured Artwork</span>
                </div>
                <div className={styles.featuredInfo}>
                  <h3>Artwork Title</h3>
                  <p>Medium • Year</p>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

