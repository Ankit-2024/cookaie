// ─── Sentry Edge Runtime Configuration ──────────────────────────────────────
// This file is imported by instrumentation.js `register()` when running
// on the Edge runtime (middleware, edge-enabled route handlers).
// The Edge runtime has a limited API surface, so this config is minimal.
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // ── Performance Monitoring ────────────────────────────────────────────────
  tracesSampleRate: 0.1,

  // ── Environment ───────────────────────────────────────────────────────────
  environment: process.env.NODE_ENV || 'development',

  // Gracefully disable if DSN is not configured.
  enabled: !!process.env.SENTRY_DSN,
});
