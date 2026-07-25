import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Upstash Redis Rate Limiter ──────────────────────────────────────────────
// Uses a sliding-window algorithm: 10 requests per 10-second window.
// Sanitizes process.env entries to remove extra quotes if passed via docker --env-file.
// ─────────────────────────────────────────────────────────────────────────────

const rawUrl = process.env.UPSTASH_REDIS_REST_URL;
const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Strip accidental surrounding double or single quotes
const url = rawUrl ? rawUrl.replace(/^["']|["']$/g, '').trim() : undefined;
const token = rawToken ? rawToken.replace(/^["']|["']$/g, '').trim() : undefined;

let ratelimit = null;

if (url && token && url.startsWith('http')) {
  try {
    const redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: 'cookaie:ratelimit',
    });
  } catch (err) {
    console.warn('[RateLimiter] Failed to initialize Upstash Redis:', err.message);
  }
}

// ─── Public Helper ───────────────────────────────────────────────────────────

/**
 * Applies rate limiting based on the client's IP address.
 * Fail-open if Redis is unconfigured or unavailable.
 *
 * @param {Request} request - The incoming Next.js route handler request.
 * @returns {Promise<{ success: boolean, limit: number, remaining: number, reset: number }>}
 */
export async function applyRateLimit(request) {
  if (!ratelimit) {
    return { success: true, limit: 10, remaining: 10, reset: Date.now() };
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.ip || 'anonymous';

  return await ratelimit.limit(ip);
}
