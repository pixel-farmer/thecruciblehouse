'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ProBadge from './ProBadge';
import FounderBadge from './FounderBadge';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCommissionsDropdownOpen, setIsCommissionsDropdownOpen] = useState(false);
  const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('');
  const [isPro, setIsPro] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const isLoggingOutRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const commissionsDropdownRef = useRef<HTMLLIElement>(null);
  const commissionsDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resourcesDropdownRef = useRef<HTMLLIElement>(null);
  const resourcesDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setAuthChecked(true);
      if (session?.user) {
        // Get avatar URL from user metadata or use avatar_url
        const avatarUrl = session.user.user_metadata?.avatar_url || 
                         session.user.user_metadata?.picture ||
                         session.user.identities?.[0]?.identity_data?.avatar_url;
        setUserAvatar(avatarUrl || null);
        
        // Check pro membership or founder status
        const userMetadata = session.user.user_metadata || {};
        const membershipStatus = userMetadata.membership_status;
        const hasPaidMembership = userMetadata.has_paid_membership;
        const founderStatus = userMetadata.is_founder === true;
        setIsFounder(founderStatus);
        setIsPro(membershipStatus === 'active' || hasPaidMembership === true || founderStatus);
        
        // Generate initials from email or name
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || '';
        if (name) {
          const nameParts = name.split(' ');
          setUserInitials(
            nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : nameParts[0][0].toUpperCase()
          );
        } else if (email) {
          setUserInitials(email[0].toUpperCase());
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't update state if we're in the process of logging out
      // This prevents UI flicker during logout
      if (isLoggingOutRef.current) {
        return;
      }
      
      setIsLoggedIn(!!session);
      setAuthChecked(true);
      if (session?.user) {
        const avatarUrl = session.user.user_metadata?.avatar_url || 
                         session.user.user_metadata?.picture ||
                         session.user.identities?.[0]?.identity_data?.avatar_url;
        setUserAvatar(avatarUrl || null);
        
        // Check pro membership or founder status
        const userMetadata = session.user.user_metadata || {};
        const membershipStatus = userMetadata.membership_status;
        const hasPaidMembership = userMetadata.has_paid_membership;
        const founderStatus = userMetadata.is_founder === true;
        setIsFounder(founderStatus);
        setIsPro(membershipStatus === 'active' || hasPaidMembership === true || founderStatus);
        
        const email = session.user.email || '';
        const name = session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || '';
        if (name) {
          const nameParts = name.split(' ');
          setUserInitials(
            nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : nameParts[0][0].toUpperCase()
          );
        } else if (email) {
          setUserInitials(email[0].toUpperCase());
        }
      } else {
        setUserAvatar(null);
        setUserInitials('');
        setIsPro(false);
        setIsFounder(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!isLoggedIn) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        setConversations(conversations);
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch unread count when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setConversations([]);
    }
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (commissionsDropdownRef.current && !commissionsDropdownRef.current.contains(event.target as Node)) {
        if (commissionsDropdownTimeoutRef.current) {
          clearTimeout(commissionsDropdownTimeoutRef.current);
          commissionsDropdownTimeoutRef.current = null;
        }
        setIsCommissionsDropdownOpen(false);
      }
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target as Node)) {
        if (resourcesDropdownTimeoutRef.current) {
          clearTimeout(resourcesDropdownTimeoutRef.current);
          resourcesDropdownTimeoutRef.current = null;
        }
        setIsResourcesDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    if (isDropdownOpen || isCommissionsDropdownOpen || isResourcesDropdownOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (commissionsDropdownTimeoutRef.current) {
        clearTimeout(commissionsDropdownTimeoutRef.current);
      }
      if (resourcesDropdownTimeoutRef.current) {
        clearTimeout(resourcesDropdownTimeoutRef.current);
      }
    };
  }, [isDropdownOpen, isCommissionsDropdownOpen, isResourcesDropdownOpen, isNotificationsOpen]);

  const handleLogout = () => {
    // Set ref flag immediately (doesn't trigger re-render)
    isLoggingOutRef.current = true;
    
    // Clear localStorage synchronously BEFORE any state updates
    if (typeof window !== 'undefined') {
      try {
        // Clear all localStorage items that might contain Supabase data
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('sb-') || 
            key.includes('supabase') || 
            key.includes('auth-token') ||
            key.includes('auth.session')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore errors
          }
        });
        
        // Clear sessionStorage
        try {
          sessionStorage.clear();
        } catch (e) {
          // Ignore errors
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Redirect IMMEDIATELY - before any React state updates
      // This prevents any UI flicker
      window.location.href = '/?logout=' + Date.now();
    }
    
    // Do async cleanup in background (won't affect redirect)
    supabase.auth.signOut({ scope: 'global' }).catch(() => {
      // Ignore errors - we're already redirecting
    });
  };

  const navLinks = [
    { href: '/artist', label: 'Artists' },
    { href: '/commissions', label: 'COMMISSIONS' },
    { href: '/community', label: 'COMMUNITY' },
    { href: '/resources', label: 'RESOURCES' },
    { href: '/pricing', label: 'PRICING' },
/*     { href: '/shop', label: 'Shop' },
 */  ];

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
          {navLinks.map((link) => {
            if (link.href === '/commissions') {
              return (
                <li key={link.href} ref={commissionsDropdownRef} className={styles.dropdownContainer}>
                  <div
                    className={styles.dropdownTrigger}
                    onMouseEnter={() => {
                      if (commissionsDropdownTimeoutRef.current) {
                        clearTimeout(commissionsDropdownTimeoutRef.current);
                        commissionsDropdownTimeoutRef.current = null;
                      }
                      setIsCommissionsDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      commissionsDropdownTimeoutRef.current = setTimeout(() => {
                        setIsCommissionsDropdownOpen(false);
                      }, 200);
                    }}
                  >
                    <Link
                      href={link.href}
                      className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {isCommissionsDropdownOpen && (
                      <div 
                        className={styles.dropdownMenu}
                        onMouseEnter={() => {
                          if (commissionsDropdownTimeoutRef.current) {
                            clearTimeout(commissionsDropdownTimeoutRef.current);
                            commissionsDropdownTimeoutRef.current = null;
                          }
                          setIsCommissionsDropdownOpen(true);
                        }}
                        onMouseLeave={() => {
                          commissionsDropdownTimeoutRef.current = setTimeout(() => {
                            setIsCommissionsDropdownOpen(false);
                          }, 200);
                        }}
                      >
                        <Link
                          href="/commissions/post-job"
                          className={styles.dropdownLink}
                          onClick={() => {
                            setIsCommissionsDropdownOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          Post a Job
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              );
            }
            if (link.href === '/resources') {
              return (
                <li key={link.href} ref={resourcesDropdownRef} className={styles.dropdownContainer}>
                  <div
                    className={styles.dropdownTrigger}
                    onMouseEnter={() => {
                      if (resourcesDropdownTimeoutRef.current) {
                        clearTimeout(resourcesDropdownTimeoutRef.current);
                        resourcesDropdownTimeoutRef.current = null;
                      }
                      setIsResourcesDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      resourcesDropdownTimeoutRef.current = setTimeout(() => {
                        setIsResourcesDropdownOpen(false);
                      }, 200);
                    }}
                  >
                    <Link
                      href={link.href}
                      className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {isResourcesDropdownOpen && (
                      <div 
                        className={styles.dropdownMenu}
                        onMouseEnter={() => {
                          if (resourcesDropdownTimeoutRef.current) {
                            clearTimeout(resourcesDropdownTimeoutRef.current);
                            resourcesDropdownTimeoutRef.current = null;
                          }
                          setIsResourcesDropdownOpen(true);
                        }}
                        onMouseLeave={() => {
                          resourcesDropdownTimeoutRef.current = setTimeout(() => {
                            setIsResourcesDropdownOpen(false);
                          }, 200);
                        }}
                      >
                        <Link
                          href="/resources/write-article"
                          className={styles.dropdownLink}
                          onClick={() => {
                            setIsResourcesDropdownOpen(false);
                            setIsMenuOpen(false);
                          }}
                        >
                          Post Article
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              );
            }
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            position: 'relative',
            minWidth: '200px', // Reserve space to prevent layout shift
            justifyContent: 'flex-end'
          }}>
          {!authChecked ? null : isLoggedIn ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                {/* Profile Picture with Dropdown */}
                <div ref={dropdownRef} style={{ position: 'relative', width: '50px', height: '50px' }}>
                  <Link
                    href="/profile"
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: userAvatar ? 'transparent' : '#ff6622',
                      color: userAvatar ? 'inherit' : 'white',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      textDecoration: 'none',
                      position: 'relative',
                      zIndex: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                      setIsMenuOpen(false);
                    }}
                  >
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt="Profile"
                        width={50}
                        height={50}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span>{userInitials || 'U'}</span>
                    )}
                  </Link>
                  {isFounder ? <FounderBadge size={18} /> : isPro && <ProBadge size={18} />}
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '60px',
                        right: '0',
                        backgroundColor: 'white',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        minWidth: '150px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <Link
                        href="/profile"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-dark)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          transition: 'background-color 0.2s ease',
                          textDecoration: 'none',
                          display: 'block',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-dark)',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Envelope Icon */}
                <Link
                  href="/messages"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dark)',
                    transition: 'opacity 0.3s ease',
                    textDecoration: 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  aria-label="Messages"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </Link>
                
                {/* Bell Icon with Notifications */}
                {isLoggedIn && (
                  <div ref={notificationsRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(!isNotificationsOpen);
                        setIsMenuOpen(false);
                        if (!isNotificationsOpen) {
                          fetchUnreadCount();
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-dark)',
                        transition: 'opacity 0.3s ease',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      aria-label="Notifications"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            backgroundColor: '#ff6622',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            minWidth: '18px',
                            textAlign: 'center',
                            lineHeight: '1.2',
                          }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notifications Dropdown */}
                    {isNotificationsOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 8px)',
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          minWidth: '320px',
                          maxWidth: '400px',
                          maxHeight: '500px',
                          overflowY: 'auto',
                          zIndex: 1001,
                        }}
                      >
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e0e0e0' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                            Notifications
                          </h3>
                        </div>
                        <div>
                          {conversations.filter((conv: any) => conv.unreadCount > 0).length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                              <p style={{ margin: 0 }}>No new notifications</p>
                            </div>
                          ) : (
                            conversations
                              .filter((conv: any) => conv.unreadCount > 0)
                              .map((conv: any) => (
                                <Link
                                  key={conv.id}
                                  href={`/messages?conversation=${conv.id}`}
                                  onClick={() => setIsNotificationsOpen(false)}
                                  style={{
                                    display: 'block',
                                    padding: '1rem',
                                    borderBottom: '1px solid #f0f0f0',
                                    textDecoration: 'none',
                                    color: 'var(--text-dark)',
                                    transition: 'background-color 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--accent-color)',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {conv.otherUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                          {conv.otherUser.name}
                                        </span>
                                        {conv.unreadCount > 0 && (
                                          <span
                                            style={{
                                              backgroundColor: '#ff6622',
                                              color: 'white',
                                              borderRadius: '10px',
                                              padding: '2px 6px',
                                              fontSize: '0.7rem',
                                              fontWeight: '600',
                                              minWidth: '18px',
                                              textAlign: 'center',
                                            }}
                                          >
                                            {conv.unreadCount}
                                          </span>
                                        )}
                                      </div>
                                      {conv.lastMessage && (
                                        <p
                                          style={{
                                            margin: 0,
                                            fontSize: '0.85rem',
                                            color: 'var(--text-light)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {conv.lastMessage.content}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              ))
                          )}
                        </div>
                        {conversations.filter((conv: any) => conv.unreadCount > 0).length > 0 && (
                          <div style={{ padding: '0.75rem', borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
                            <Link
                              href="/messages"
                              onClick={() => setIsNotificationsOpen(false)}
                              style={{
                                color: 'var(--accent-color)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                              }}
                            >
                              View all messages
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className={`inline-block py-2 rounded-xl focus:outline-none ${styles.authButton}`}
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
              <Link
                href="/signup"
                onClick={() => setIsMenuOpen(false)}
                className={`inline-block py-2 rounded-xl focus:outline-none ${styles.authButton}`}
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
            </>
          )}
          </li>
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

