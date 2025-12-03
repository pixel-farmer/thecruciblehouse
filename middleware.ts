import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './app/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const session = await verifySession();
    
    // Allow access to login page
    if (pathname === '/admin/login') {
      // If already logged in, redirect to dashboard
      if (session) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    // Require authentication for all other admin routes
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

