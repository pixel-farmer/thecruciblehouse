import Link from 'next/link';
import styles from './Footer.module.css';
import { siteConfig } from '@/site.config';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <img
              src={siteConfig.logo.footer}
              alt={siteConfig.logo.alt}
              className={styles.footerLogoImg}
            />
          </div>
          <div className={styles.footerLinks}>
            <Link href="/artist">Artists</Link>
            <Link href="/commissions">Commissions</Link>
            <Link href="/community">Community</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/pricing">Pricing</Link>
            <a href={`mailto:${siteConfig.contactEmail}`}>Contact</a>
{/*             <Link href="/shop">Shop</Link>
 */}          </div>
          {/* <div className={styles.footerSocial}>
            
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Twitter">Twitter</a>
          </div> */}
          <div className={styles.footerSocial}><a href={siteConfig.social.instagram} aria-label="Instagram">Instagram</a></div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {year} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

