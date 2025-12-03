import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const secretKey = process.env.AUTH_SECRET || 'your-secret-key-change-in-production';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const session = await encrypt({ userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) {
    return null;
  }

  const payload = await decrypt(session);
  
  if (!payload || new Date(payload.expiresAt) < new Date()) {
    return null;
  }

  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

