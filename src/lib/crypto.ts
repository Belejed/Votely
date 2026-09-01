import { webcrypto } from 'crypto';

/**
 * Hashes a password using SHA-256 (supported in Next.js Edge/Server actions natively)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'votely_salt_token_2026'); // basic salt
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b: any) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifies a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}
