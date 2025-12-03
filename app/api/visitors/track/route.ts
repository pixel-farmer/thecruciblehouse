import { NextRequest, NextResponse } from 'next/server';
import { addVisitor } from '@/app/lib/visitor-tracking';

async function getLocationFromIP(ip: string) {
  // Skip if IP is localhost, unknown, or private
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
    return { country: undefined, region: undefined, city: undefined };
  }

  try {
    // Using ip-api.com free service (no API key required for basic usage)
    // Rate limit: 45 requests per minute
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { country: undefined, region: undefined, city: undefined };
    }

    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || undefined,
        region: data.regionName || undefined,
        city: data.city || undefined,
      };
    }

    return { country: undefined, region: undefined, city: undefined };
  } catch (error) {
    // Silently fail - don't block visitor tracking if geolocation fails
    console.error('Geolocation error:', error);
    return { country: undefined, region: undefined, city: undefined };
  }
}

// List of suspicious paths commonly used by bots/scanners
const SUSPICIOUS_PATTERNS = [
  /^\/cmd/i,
  /^\/cgi-bin/i,
  /^\/wp-admin/i,
  /^\/wp-content/i,
  /^\/wp-includes/i,
  /^\/phpmyadmin/i,
  /^\/adminer/i,
  /^\/\.env/i,
  /^\/\.git/i,
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
];

function isSuspiciousPath(path: string): boolean {
  if (!path || path === 'unknown') return false;
  
  // Check against suspicious patterns
  if (SUSPICIOUS_PATTERNS.some(pattern => pattern.test(path))) {
    return true;
  }
  
  // Check for suspicious keywords in path
  const suspiciousKeywords = [
    'cmd', 'exec', 'shell', 'eval', 'system', 'admin', 'config',
    'backup', 'db', 'sql', 'php', 'asp', 'jsp', 'cgi', 'bin',
  ];
  
  const lowerPath = path.toLowerCase();
  return suspiciousKeywords.some(keyword => lowerPath.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    const { page } = await request.json();
    
    // Skip tracking for suspicious paths (bot/scanner requests)
    if (isSuspiciousPath(page)) {
      console.log('Skipping tracking for suspicious path:', page);
      return NextResponse.json({ success: true, skipped: true });
    }
    
    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    
    // Get user agent and referer
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'direct';

    // Get geographic location from IP
    const location = await getLocationFromIP(ip);

    console.log('Tracking visit:', { page, ip, hasLocation: !!location.country });

    await addVisitor({
      page: page || 'unknown',
      ip: ip || 'unknown',
      userAgent,
      referer,
      country: location.country,
      region: location.region,
      city: location.city,
    });

    console.log('Visitor tracked successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Visitor tracking error:', error);
    // Don't fail the request if tracking fails
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

