import { NextResponse } from 'next/server';
import { deleteSession } from '@/app/lib/auth';

export async function POST() {
  try {
    await deleteSession();
    console.log('[auth/logout] Session deleted successfully');
    
    // Return response with cookie deletion headers to ensure cookie is cleared
    const response = NextResponse.json({ success: true });
    
    // Explicitly clear the session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0), // Set to past date to delete
    });
    
    return response;
  } catch (error) {
    console.error('[auth/logout] Error during logout:', error);
    // Still return success and clear cookie even if there's an error
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0),
    });
    return response;
  }
}

