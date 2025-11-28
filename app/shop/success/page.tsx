'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from '../../styles/ArtworkDetail.module.css';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // You can verify the session here if needed
    if (sessionId) {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.artworkDetail} style={{ paddingTop: '120px', paddingBottom: '100px', minHeight: '60vh' }}>
        <div className={styles.container}>
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '20px' }}>
              Thank You!
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', marginBottom: '40px', lineHeight: '1.8' }}>
              Your purchase has been confirmed. We'll be in touch shortly with shipping details.
            </p>
            {sessionId && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '40px' }}>
                Order ID: {sessionId}
              </p>
            )}
            <Link href="/shop" style={{ display: 'inline-block' }}>
              <button className={styles.buyButton} style={{ width: 'auto', padding: '18px 60px' }}>
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
