import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <img
              src="/CH logo300wh.png"
              alt="The Crucible House"
              className={styles.footerLogoImg}
            />
          </div>
          <div className={styles.footerLinks}>
            <Link href="/artist">Artists</Link>
            <Link href="/commissions">Commissions</Link>
            <Link href="/community">Community</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/pricing">Pricing</Link>
{/*             <Link href="/shop">Shop</Link>
 */}          </div>
          <div className={styles.footerSocial}>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Twitter">Twitter</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 The Crucible House. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

