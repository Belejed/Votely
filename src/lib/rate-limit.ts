// Lightweight sliding window in-memory rate limiter for server actions & APIs

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if an identifier (e.g. IP + action name) exceeds allowed request limit
 * @param key unique identifier (e.g. `login:${ip}`)
 * @param maxRequests maximum attempts allowed within the window
 * @param windowSeconds duration of rate limiting window in seconds (default: 60s)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowSeconds: number = 60
): { success: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { success: true, remaining: maxRequests - 1, resetSeconds: windowSeconds };
  }

  if (record.count >= maxRequests) {
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { success: false, remaining: 0, resetSeconds };
  }

  record.count += 1;
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
  return { success: true, remaining: maxRequests - record.count, resetSeconds };
}
