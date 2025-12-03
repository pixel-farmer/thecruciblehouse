'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// List of suspicious paths commonly used by bots/scanners
const SUSPICIOUS_PATHS = [
  /^\/cmd/i,
  /^\/cgi-bin/i,
  /^\/wp-admin/i,
  /^\/wp-content/i,
  /^\/wp-includes/i,
  /^\/phpmyadmin/i,
  /^\/adminer/i,
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/\.well-known/i,
  /^\/api\/v1/i,
  /^\/xmlrpc/i,
  /^\/readme/i,
  /^\/license/i,
  /^\/test/i,
  /^\/tmp/i,
  /^\/backup/i,
  /^\/config/i,
  /^\/database/i,
  /^\/db/i,
  /^\/sql/i,
  /^\/shell/i,
  /^\/eval/i,
  /^\/exec/i,
  /^\/system/i,
  /^\/root/i,
  /^\/bin/i,
  /^\/etc/i,
  /^\/var/i,
  /^\/usr/i,
  /^\/lib/i,
  /^\/opt/i,
  /^\/srv/i,
  /^\/home/i,
  /^\/proc/i,
  /^\/dev/i,
  /^\/sys/i,
  /^\/boot/i,
  /^\/mnt/i,
  /^\/media/i,
  /^\/run/i,
  /^\/lost\+found/i,
  /^\/sbin/i,
  /^\/usr\/bin/i,
  /^\/usr\/sbin/i,
  /^\/usr\/local/i,
  /^\/usr\/share/i,
  /^\/usr\/lib/i,
  /^\/usr\/include/i,
  /^\/usr\/src/i,
  /^\/usr\/games/i,
  /^\/usr\/libexec/i,
  /^\/usr\/lib64/i,
  /^\/usr\/lib32/i,
  /^\/usr\/libx32/i,
  /^\/usr\/libexec/i,
  /^\/usr\/local\/bin/i,
  /^\/usr\/local\/sbin/i,
  /^\/usr\/local\/lib/i,
  /^\/usr\/local\/share/i,
  /^\/usr\/local\/include/i,
  /^\/usr\/local\/src/i,
  /^\/usr\/local\/games/i,
  /^\/usr\/local\/libexec/i,
  /^\/usr\/local\/lib64/i,
  /^\/usr\/local\/lib32/i,
  /^\/usr\/local\/libx32/i,
  /^\/usr\/local\/libexec/i,
];

// Valid routes that should be tracked
// Note: We'll track most routes except API routes and suspicious paths
// The suspicious path check will filter out bad requests
const VALID_ROUTES = [
  /^\/$/,                    // Home
  /^\/artist(\/.*)?$/,       // Artist pages
  /^\/commissions(\/.*)?$/,  // Commissions
  /^\/community(\/.*)?$/,   // Community
  /^\/resources(\/.*)?$/,   // Resources
  /^\/shop(\/.*)?$/,        // Shop pages
  /^\/login$/,              // Login
  /^\/signup$/,             // Signup
  /^\/forgot-password$/,    // Forgot password
  /^\/admin(\/.*)?$/,       // Admin (though we might want to exclude this)
];

function isSuspiciousPath(pathname: string): boolean {
  // Skip API routes - these are server-side only
  if (pathname.startsWith('/api/')) {
    return true;
  }
  
  // Skip Next.js internal routes
  if (pathname.startsWith('/_next/') || pathname.startsWith('/_vercel/')) {
    return true;
  }
  
  // Check against suspicious patterns
  if (SUSPICIOUS_PATHS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  
  // Check if it's a valid route - if so, allow tracking
  if (VALID_ROUTES.some(pattern => pattern.test(pathname))) {
    return false;
  }
  
  // If it's not a valid route and contains suspicious patterns, mark as suspicious
  // This catches things like /cmd_sco, /wp-admin, etc.
  const suspiciousKeywords = [
    'cmd', 'exec', 'shell', 'eval', 'system', 'config',
    'backup', 'db', 'sql', 'php', 'asp', 'jsp', 'cgi', 'bin',
    'root', 'etc', 'var', 'usr', 'lib', 'opt', 'srv', 'home',
    'proc', 'dev', 'sys', 'boot', 'mnt', 'media', 'run',
  ];
  
  const lowerPath = pathname.toLowerCase();
  // Only mark as suspicious if it contains suspicious keywords
  // Otherwise, allow tracking (might be a new valid route we haven't added yet)
  return suspiciousKeywords.some(keyword => lowerPath.includes(keyword));
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking for suspicious paths (bot/scanner requests)
    if (isSuspiciousPath(pathname)) {
      console.log(`[VisitorTracker] Skipping suspicious path: ${pathname}`);
      return;
    }

    // Track page visit
    const trackVisit = async () => {
      try {
        console.log(`[VisitorTracker] Tracking visit to: ${pathname}`);
        const response = await fetch('/api/visitors/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[VisitorTracker] Visit tracked successfully:`, data);
        } else {
          console.error(`[VisitorTracker] Failed to track visit: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        // Log error but don't interrupt user experience
        console.error('[VisitorTracker] Visitor tracking error:', error);
      }
    };

    trackVisit();
  }, [pathname]);

  return null; // This component doesn't render anything
}

