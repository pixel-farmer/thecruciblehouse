'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './pricing.module.css';

export default function PricingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasProMembership, setHasProMembership] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const membershipStatus = session.user.user_metadata?.membership_status;
        const hasPaidMembership = session.user.user_metadata?.has_paid_membership;
        setHasProMembership(membershipStatus === 'active' || hasPaidMembership === true);
      } else {
        setIsLoggedIn(false);
        setHasProMembership(false);
      }
    };
    checkMembership();
  }, []);

  const handleUpgrade = () => {
    router.push('/community?upgrade=true');
  };

  const freeFeatures = [
    'Post articles',
    'Upload art',
    'Post on main community feed',
    'Join groups',
  ];

  const proFeatures = [
    'Host a meetup',
    'Post an exhibit',
    'Create groups',
    'Post a job',
    'Apply for commissions',
    'Search for artists near you on the map',
  ];

  return (
    <div className={styles.pricingPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Choose Your Plan</h1>
          <p className={styles.subtitle}>Select the plan that's right for you</p>
        </div>

        <div className={styles.pricingGrid}>
          {/* Free Plan */}
          <div className={styles.pricingCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Free</h2>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$0</span>
                <span className={styles.pricePeriod}>/month</span>
              </div>
            </div>
            <div className={styles.cardContent}>
              <ul className={styles.featuresList}>
                {freeFeatures.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <svg
                      className={styles.checkIcon}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {!isLoggedIn && (
                <Link href="/login" className={styles.ctaButton}>
                  Get Started
                </Link>
              )}
              {isLoggedIn && !hasProMembership && (
                <div className={styles.currentPlanBadge}>Current Plan</div>
              )}
            </div>
          </div>

          {/* Pro Plan */}
          <div className={`${styles.pricingCard} ${styles.proCard}`}>
            <div className={styles.proBadge}>Most Popular</div>
            <div className={styles.cardHeader}>
              <h2 className={styles.planName}>Pro</h2>
              <div className={styles.price}>
                <span className={styles.priceAmount}>$8</span>
                <span className={styles.pricePeriod}>/month</span>
              </div>
              <p className={styles.priceNote}>Billed monthly, cancel anytime</p>
            </div>
            <div className={styles.cardContent}>
              <ul className={styles.featuresList}>
                {freeFeatures.map((feature, index) => (
                  <li key={`free-${index}`} className={styles.featureItem}>
                    <svg
                      className={styles.checkIcon}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
                {proFeatures.map((feature, index) => (
                  <li key={`pro-${index}`} className={`${styles.featureItem} ${styles.proFeature}`}>
                    <svg
                      className={styles.checkIcon}
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {!hasProMembership ? (
                <Link 
                  href={isLoggedIn ? "/community?upgrade=true" : "/login"} 
                  className={`${styles.ctaButton} ${styles.proButton}`}
                >
                  {isLoggedIn ? 'Upgrade to Pro' : 'Sign Up for Pro'}
                </Link>
              ) : (
                <div className={`${styles.currentPlanBadge} ${styles.proBadgeActive}`}>
                  Current Plan
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

