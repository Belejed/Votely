/**
 * Standard SHA-256 password hasher with universal subtle crypto support
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'votely_salt_token_2026');
  
  let subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    const nodeCrypto = await import('crypto');
    subtle = nodeCrypto.webcrypto.subtle;
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
