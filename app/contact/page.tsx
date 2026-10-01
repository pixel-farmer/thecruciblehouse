'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/Contact.module.css';
import ScrollAnimation from '../components/ScrollAnimation';
import { siteConfig } from '@/site.config';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.contact} style={{ paddingTop: '120px' }}>
      <div className={styles.container}>
        <ScrollAnimation>
          <h2 className={styles.sectionTitle}>Contact</h2>
        </ScrollAnimation>
        <ScrollAnimation>
          <div className={styles.contactContent}>
            <div className={styles.contactInfo}>
            <h3>Get In Touch</h3>
            <p>
              Questions about membership, events, or the community? Send a note and we will get back to you.
            </p>
            <div className={styles.contactDetails}>
              <p><strong>Email:</strong> <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a></p>
              <p><strong>Follow Us:</strong></p>
              <div className={styles.socialLinks}>
                <a href={siteConfig.social.instagram} className={styles.socialLink} aria-label="Instagram" target="_blank" rel="noopener noreferrer">Instagram</a>
              </div>
            </div>
          </div>
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Message"
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>Send Message</button>
          </form>
          </div>
        </ScrollAnimation>
      </div>
    </section>
    </motion.div>
  );
}

