import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // ── Dev Origins ────────────────────────────────────────────────────────────
  allowedDevOrigins: [
    'localhost',
    '10.206.38.178',
  ],

  // ── Suppress the X-Powered-By: Next.js header ─────────────────────────────
  poweredByHeader: false,

  // ── Production Security Headers ────────────────────────────────────────────
  // Applied to ALL routes. See: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ── Content Security Policy ──────────────────────────────────────
          // Restricts resource origins to prevent XSS and data injection.
          //   • script-src: 'unsafe-inline' + 'unsafe-eval' needed for Next.js
          //     hydration and dev tooling. Tighten with nonces in production
          //     middleware if desired.
          //   • img-src: allows Swiggy CDN thumbnails and Google APIs.
          //   • connect-src: allows Gemini, YouTube, and Swiggy API calls.
          //   • frame-ancestors 'none': equivalent to X-Frame-Options DENY.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: *.swiggy.com *.googleapis.com *.ytimg.com *.youtube.com",
              "connect-src 'self' *.googleapis.com *.swiggy.com *.ingest.sentry.io https://www.youtube.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "font-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },

          // ── HSTS ────────────────────────────────────────────────────────
          // Forces HTTPS for 2 years, including subdomains.
          // `preload` signals intent to join the browser HSTS preload list.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },

          // ── Clickjacking Protection ─────────────────────────────────────
          // Prevents the site from being embedded in iframes.
          // Redundant with CSP frame-ancestors but kept for older browsers.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },

          // ── MIME-Type Sniffing Protection ────────────────────────────────
          // Prevents browsers from guessing Content-Type.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },

          // ── Referrer Policy ─────────────────────────────────────────────
          // Sends full URL as referrer to same origin, only the origin to
          // cross-origin requests, and nothing on downgrade (HTTPS → HTTP).
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },

          // ── DNS Prefetch ────────────────────────────────────────────────
          // Enables preemptive DNS resolution for external domains
          // (Swiggy CDN, Google APIs) to reduce latency.
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },

          // ── Permissions Policy ──────────────────────────────────────────
          // Disables browser features the app does not use.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

// ─── Sentry Build Integration ────────────────────────────────────────────────
// withSentryConfig wraps the Next.js config to:
//   • Upload source maps to Sentry for readable stack traces
//   • Attach release/commit metadata for error correlation
//   • Auto-instrument server components and route handlers
export default withSentryConfig(nextConfig, {
  // Suppress noisy Sentry build logs in CI
  silent: true,

  // Disable source map deletion so standalone Docker builds work.
  // Source maps are uploaded to Sentry but also kept in the bundle.
  // For public-facing apps, set `hideSourceMaps: true` to strip them.
  hideSourceMaps: false,

  // Disable the Sentry webpack plugin's telemetry
  telemetry: false,
});
