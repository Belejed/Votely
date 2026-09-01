/**
 * Universal SHA-256 password hasher compatible with Node.js and Next.js / Vercel Edge & Serverless
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'votely_salt_token_2026');

  // Use globalThis.crypto if available, else dynamically import node crypto
  const globalCrypto = (globalThis as any).crypto;
  let subtle = globalCrypto?.subtle;

  if (!subtle) {
    const nodeCrypto = await import('crypto');
    subtle = (nodeCrypto as any).webcrypto?.subtle;
  }

  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}
