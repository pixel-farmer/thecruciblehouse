'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './styles/Home.module.css';
import ScrollAnimation from './components/ScrollAnimation';

interface RecentArtist {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  discipline: string | null;
}

interface FeaturedArtwork {
  id: string;
  image_url: string;
  title: string | null;
  artistName: string;
}

export default function Home() {
  const router = useRouter();
  const [recentArtists, setRecentArtists] = useState<RecentArtist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [featuredArtwork, setFeaturedArtwork] = useState<FeaturedArtwork[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [particles, setParticles] = useState<Array<{left: number; delay: number; duration: number}>>([]);
  
  // Generate particle positions only on client to avoid hydration mismatch
  // Defer particle initialization until after first paint
  useEffect(() => {
    const initParticles = () => {
      setParticles(
        Array.from({ length: 25 }).map(() => ({
          left: Math.random() * 100,
          delay: Math.random() * 20,
          duration: 20 + Math.random() * 15
        }))
      );
    };

    // Use requestIdleCallback if available, otherwise use setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(initParticles, { timeout: 100 });
    } else {
      setTimeout(initParticles, 100);
    }
  }, []);

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

  useEffect(() => {
    // Fetch recently joined artists
    const fetchRecentArtists = async () => {
      try {
        const response = await fetch('/api/artists/recent');
        if (response.ok) {
          const data = await response.json();
          setRecentArtists(data.artists || []);
        }
      } catch (error) {
        console.error('Error fetching recent artists:', error);
      } finally {
        setLoadingArtists(false);
      }
    };

    // Fetch featured artwork (top 3 most liked)
    const fetchFeaturedArtwork = async () => {
      try {
        const response = await fetch('/api/artwork/featured');
        if (response.ok) {
          const data = await response.json();
          setFeaturedArtwork(data.featuredArtwork || []);
        }
      } catch (error) {
        console.error('Error fetching featured artwork:', error);
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchRecentArtists();
    fetchFeaturedArtwork();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.hero}>
        <div className={styles.heatGradient}></div>
        <div className={styles.particles}>
          {particles.map((particle, i) => (
            <div key={i} className={styles.particle} style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}></div>
          ))}
        </div>
        <ScrollAnimation>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>The Crucible House</h1>
            <p className={styles.heroSubtitle}>Where Art and Connections are Forged!</p>
            <p className={styles.heroTagline}>(AI-Free Zone)</p>
            <Link href="/artist" className={styles.ctaButton}>
              View Artists
            </Link>
          </div>
        </ScrollAnimation>
      </section>

      <section className={styles.recentArtists}>
        <div className={styles.container}>
          <ScrollAnimation delay={0.2}>
            <h2 className={styles.sectionTitle}>Recently Joined Artists</h2>
          </ScrollAnimation>
          {loadingArtists ? (
            <div className={styles.artistsGrid}>
              <div className={styles.loadingText}>Loading artists...</div>
            </div>
          ) : recentArtists.length > 0 ? (
            <ScrollAnimation delay={0.25}>
              <div className={styles.artistsGrid}>
                {recentArtists.map((artist) => (
                  <Link key={artist.id} href={`/artist/${artist.slug}`} className={styles.artistAvatarLink}>
                    <div className={styles.artistAvatarContainer}>
                      {artist.avatar_url ? (
                        <div className={styles.artistAvatarImage}>
                          <Image
                            src={artist.avatar_url}
                            alt={artist.name}
                            width={80}
                            height={80}
                            className={styles.artistAvatar}
                          />
                        </div>
                      ) : (
                        <div className={styles.artistAvatarPlaceholder}>
                          {artist.initials}
                        </div>
                      )}
                      <div className={styles.artistTooltip}>
                        <div className={styles.artistTooltipName}>{artist.name}</div>
                        {artist.discipline && (
                          <div className={styles.artistTooltipDiscipline}>{artist.discipline}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollAnimation>
          ) : (
            <div className={styles.artistsGrid}>
              <div className={styles.noArtistsText}>No artists yet</div>
            </div>
          )}
        </div>
      </section>

      <section className={styles.featured}>
        <div className={styles.container}>
          <ScrollAnimation delay={0.2}>
            <h2 className={styles.sectionTitle}>Featured Works</h2>
          </ScrollAnimation>
          {loadingFeatured ? (
            <div className={styles.featuredGrid}>
              <div className={styles.loadingText}>Loading featured artwork...</div>
            </div>
          ) : featuredArtwork.length > 0 ? (
            <ScrollAnimation delay={0.25}>
              <div className={styles.featuredGrid}>
                {featuredArtwork.map((artwork) => (
                  <div key={artwork.id} className={styles.featuredItem}>
                    {artwork.image_url ? (
                      <div className={styles.featuredImageContainer}>
                        <Image
                          src={artwork.image_url}
                          alt={artwork.title || 'Featured Artwork'}
                          width={400}
                          height={400}
                          className={styles.featuredImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.featuredImagePlaceholder}>
                        <span>Featured Artwork</span>
                      </div>
                    )}
                    <div className={styles.featuredInfo}>
                      <h3>{artwork.artistName}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollAnimation>
          ) : (
            <div className={styles.featuredGrid}>
              <div className={styles.noArtworkText}>No featured artwork yet</div>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}

