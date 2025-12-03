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
const VALID_ROUTES = [
  /^\/$/,
  /^\/artist(\/.*)?$/,
  /^\/about$/,
  /^\/contact$/,
  /^\/shop(\/.*)?$/,
  /^\/admin(\/.*)?$/,
];

function isSuspiciousPath(pathname: string): boolean {
  // Check against suspicious patterns
  if (SUSPICIOUS_PATHS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  
  // Check if it's a valid route
  if (VALID_ROUTES.some(pattern => pattern.test(pathname))) {
    return false;
  }
  
  // If it's not a valid route and contains suspicious patterns, mark as suspicious
  // This catches things like /cmd_sco, /wp-admin, etc.
  const suspiciousKeywords = [
    'cmd', 'exec', 'shell', 'eval', 'system', 'admin', 'config',
    'backup', 'db', 'sql', 'php', 'asp', 'jsp', 'cgi', 'bin',
    'root', 'etc', 'var', 'usr', 'lib', 'opt', 'srv', 'home',
    'proc', 'dev', 'sys', 'boot', 'mnt', 'media', 'run',
  ];
  
  const lowerPath = pathname.toLowerCase();
  return suspiciousKeywords.some(keyword => lowerPath.includes(keyword));
}

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip tracking for suspicious paths (bot/scanner requests)
    if (isSuspiciousPath(pathname)) {
      return;
    }

    // Track page visit
    const trackVisit = async () => {
      try {
        await fetch('/api/visitors/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: pathname,
          }),
        });
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.error('Visitor tracking error:', error);
      }
    };

    trackVisit();
  }, [pathname]);

  return null; // This component doesn't render anything
}

