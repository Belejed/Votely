import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'votely_super_secret_jwt_key_2026_premium_saas'
);

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'OBSERVER';
  organizationId: string | null;
  organizationSlug: string | null;
}

export interface VoterSession {
  voterId: string;
  name: string;
  studentId: string | null;
  organizationId: string;
  organizationSlug: string;
  qrToken: string;
  eventId: string; // Active event they logged into
}

export async function encrypt(payload: any, expiresIn: string = '24h'): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export async function decrypt<T>(input: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, {
      algorithms: ['HS256'],
    });
    return payload as T;
  } catch (error) {
    return null;
  }
}

// Set admin session cookie
export async function setAdminSession(sessionData: AdminSession) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  const token = await encrypt(sessionData, '24h');
  const cookieStore = await cookies();
  cookieStore.set('votely_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

// Get admin session
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('votely_admin_session')?.value;
  if (!token) return null;
  return await decrypt<AdminSession>(token);
}

// Remove admin session cookie
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete('votely_admin_session');
}

// Set voter session cookie
export async function setVoterSession(sessionData: VoterSession, maxAgeSeconds: number = 300) {
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
  const token = await encrypt(sessionData, `${maxAgeSeconds}s`);
  const cookieStore = await cookies();
  cookieStore.set('votely_voter_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

// Get voter session
export async function getVoterSession(): Promise<VoterSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('votely_voter_session')?.value;
  if (!token) return null;
  return await decrypt<VoterSession>(token);
}

// Remove voter session cookie
export async function clearVoterSession() {
  const cookieStore = await cookies();
  cookieStore.delete('votely_voter_session');
}
