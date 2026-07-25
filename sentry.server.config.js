// ─── Sentry Server (Node.js) Configuration ──────────────────────────────────
// This file is imported by instrumentation.js `register()` when running
// on the Node.js runtime. It initializes Sentry on the server to capture:
//   • Unhandled exceptions in route handlers, server components, and actions
//   • Server-side performance traces
//   • Pino log lines as Sentry breadcrumbs (via pinoIntegration)
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // ── Performance Monitoring ────────────────────────────────────────────────
  // Sample 10% of server-side transactions. Increase to 1.0 during early
  // launch for full visibility, then dial back as traffic grows.
  tracesSampleRate: 0.1,

  // ── Pino Integration ──────────────────────────────────────────────────────
  // Bridges Pino log output → Sentry breadcrumbs. When an error is captured,
  // the breadcrumb trail includes recent Pino log lines for context.
  integrations: [
    Sentry.pinoIntegration(),
  ],

  // ── Environment & Release ─────────────────────────────────────────────────
  environment: process.env.NODE_ENV || 'development',

  // Gracefully disable if DSN is not configured.
  enabled: !!process.env.SENTRY_DSN,
});
