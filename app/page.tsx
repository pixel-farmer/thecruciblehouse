'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './styles/Home.module.css';
import ScrollAnimation from './components/ScrollAnimation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if we have authentication tokens in the URL hash
    // Supabase redirects to the Site URL (home page) with hash fragments
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      // If we have a recovery token, redirect to reset-password page
      if (accessToken && type === 'recovery') {
        // Preserve the hash when redirecting
        router.push(`/reset-password${window.location.hash}`);
      }
      // If we have a signup confirmation token, redirect to login page with success message
      // The session will be automatically confirmed by Supabase when the hash is processed
      else if (accessToken && type === 'signup') {
        // Clear the hash and redirect to login with success
        router.push('/login?confirmed=true');
      }
    }
  }, [router]);

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
            <p className={styles.heroSubtitle}>Where Art and Connections are Forged</p>
            <p className={styles.heroSubtitle}>We’re building a space for artists to connect, share, and grow together. Check back soon!</p>
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

