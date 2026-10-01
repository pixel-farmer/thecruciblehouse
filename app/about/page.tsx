'use client';

import { motion } from 'framer-motion';
import styles from '../styles/About.module.css';
import ScrollAnimation from '../components/ScrollAnimation';
import { siteConfig } from '@/site.config';

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.about} style={{ paddingTop: '120px' }}>
      <div className={styles.container}>
        <ScrollAnimation>
          <div className={styles.aboutContent}>
            <div className={styles.aboutText}>
              <h2 className={styles.sectionTitle}>About</h2>
              <p>
                Welcome to {siteConfig.name}. This is a home for people who want to share work,
                find opportunities, and spend time together.
              </p>
              <p>
                Members can show their work, join conversations, and discover commissions,
                open calls, and events.
              </p>
              <p>
                Use this page to tell visitors who you are and what this community is for.
              </p>
            </div>
            <div className={styles.aboutImage}>
              <div className={styles.aboutImagePlaceholder}>
                <span>Artist Photo</span>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
    </motion.div>
  );
}

