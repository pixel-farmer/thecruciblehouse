'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import LogoutButton from '@/components/LogoutButton';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navLinks = [
    { href: '/artist', label: 'Artists' },
    { href: '/commissions', label: 'COMMISSIONS' },
    { href: '/community', label: 'COMMUNITY' },
    { href: '/resources', label: 'RESOURCES' },
    { href: '/shop', label: 'Shop' },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.logo}>
          <Link href="/">
            <Image
              src="/CH logo300.jpg"
              alt="The Crucible House"
              width={300}
              height={85}
              className={styles.logoImg}
              priority
            />
          </Link>
        </div>
        <ul className={`${styles.navMenu} ${isMenuOpen ? styles.active : ''}`}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {isLoggedIn ? (
            <li>
              <div onClick={() => setIsMenuOpen(false)}>
                <LogoutButton />
              </div>
            </li>
          ) : (
            <>
              <li>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-block py-2 rounded-xl focus:outline-none"
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontFamily: 'var(--font-inter)',
                    borderRadius: '0.75rem',
                    backgroundColor: '#ff6622',
                    color: 'white',
                    outline: 'none',
                    border: 'none',
                    textDecoration: 'none',
                    transition: 'background-color 0.3s ease',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e55a1a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff6622';
                  }}
                >
                  SIGN IN
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-block py-2 rounded-xl focus:outline-none"
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontFamily: 'var(--font-inter)',
                    borderRadius: '0.75rem',
                    backgroundColor: '#ff6622',
                    color: 'white',
                    outline: 'none',
                    border: 'none',
                    textDecoration: 'none',
                    transition: 'background-color 0.3s ease',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e55a1a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff6622';
                  }}
                >
                  SIGN UP
                </Link>
              </li>
            </>
          )}
        </ul>
        <div
          className={styles.hamburger}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
}

