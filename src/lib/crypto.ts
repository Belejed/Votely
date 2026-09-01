import { randomBytes, pbkdf2Sync, timingSafeEqual, createHash } from 'crypto';

const PBKDF2_ITERATIONS = 100000;
const KEY_LEN = 32;
const DIGEST = 'sha256';

/**
 * Modern PBKDF2 password hasher with per-user cryptographic salt
 * Format: pbkdf2:100000:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Constant-time password verification supporting modern PBKDF2 and legacy SHA-256 fallback
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  try {
    // 1. Check if stored hash is PBKDF2 format
    if (storedHash.startsWith('pbkdf2:')) {
      const parts = storedHash.split(':');
      if (parts.length !== 4) return false;
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalKeyHex = parts[3];

      const derivedKey = pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST);
      const originalBuffer = Buffer.from(originalKeyHex, 'hex');

      if (derivedKey.length !== originalBuffer.length) return false;
      return timingSafeEqual(derivedKey, originalBuffer);
    }

    // 2. Legacy fallback: SHA-256 with static salt (backward compatibility)
    const legacyData = password + 'votely_salt_token_2026';
    const legacyHash = createHash('sha256').update(legacyData).digest('hex');
    
    const inputBuffer = Buffer.from(legacyHash, 'utf8');
    const storedBuffer = Buffer.from(storedHash, 'utf8');
    if (inputBuffer.length !== storedBuffer.length) return false;
    return timingSafeEqual(inputBuffer, storedBuffer);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}
