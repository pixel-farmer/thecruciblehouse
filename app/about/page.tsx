'use client';

import { motion } from 'framer-motion';
import styles from '../styles/About.module.css';
import ScrollAnimation from '../components/ScrollAnimation';

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
                Welcome to The Crucible House, a contemporary art gallery dedicated to showcasing 
                exceptional works of art. We celebrate the transformative power of creativity and 
                the artistic journey.
              </p>
              <p>
                Our gallery serves as a space where art is forged—where ideas, techniques, and 
                vision come together to create something extraordinary. We are committed to 
                presenting thought-provoking and visually striking artwork that resonates with 
                collectors and art enthusiasts alike.
              </p>
              <p>
                In addition to our current exhibitions, we look forward to featuring emerging and 
                established artists in the future, creating a diverse and dynamic collection that 
                represents the best of contemporary art.
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

