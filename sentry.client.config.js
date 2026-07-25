// ─── Sentry Client (Browser) Configuration ──────────────────────────────────
// This file is imported by instrumentation-client.js before React hydration.
// It initializes Sentry in the browser to capture:
//   • Unhandled JS exceptions and promise rejections
//   • Page load & navigation performance (Web Vitals)
//   • Session replays on error (for debugging user-facing crashes)
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // ── Performance Monitoring ────────────────────────────────────────────────
  // Sample 10% of transactions in production. Set to 1.0 for full coverage
  // during early low-traffic launch, then reduce as traffic grows.
  tracesSampleRate: 0.1,

  // ── Session Replay ────────────────────────────────────────────────────────
  // Captures a DOM replay for debugging. Sampling keeps costs manageable:
  //   • 10% of normal sessions (background noise)
  //   • 100% of sessions where an error occurred (the ones you need)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // ── Environment & Release ─────────────────────────────────────────────────
  environment: process.env.NODE_ENV || 'development',

  // Filter noisy errors that aren't actionable.
  ignoreErrors: [
    // Browser extensions and network flakiness
    'ResizeObserver loop',
    'Network request failed',
    'Load failed',
    'Failed to fetch',
  ],

  // Gracefully disable if DSN is not configured.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
