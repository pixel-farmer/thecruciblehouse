import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifyPassword, hashPassword } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Check if ADMIN_PASSWORD_HASH is set in environment
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
    
    let isValid = false;

    if (ADMIN_PASSWORD_HASH) {
      // Verify against stored hash
      isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    } else {
      // Fallback: Use plain text password from env (for development only)
      // In production, always use ADMIN_PASSWORD_HASH
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'B1@ckOut';
      isValid = password === ADMIN_PASSWORD;
      
      if (!ADMIN_PASSWORD) {
        console.warn('⚠️  Warning: Using default password. Set ADMIN_PASSWORD_HASH in production!');
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session
    await createSession('admin');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

