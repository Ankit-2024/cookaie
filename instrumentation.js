// ─── Next.js Server Instrumentation ─────────────────────────────────────────
// This file is loaded once when the Next.js server starts. It handles:
//   1. `register()` — Initializes Sentry for the appropriate runtime
//   2. `onRequestError()` — Captures all unhandled server errors globally
//      (route handlers, server components, server actions, proxies)
//
// Placement: project root (next to next.config.mjs)
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
// ─────────────────────────────────────────────────────────────────────────────

export async function register() {
  // Import the correct Sentry config based on the runtime environment.
  // Next.js sets NEXT_RUNTIME to 'nodejs' or 'edge' at build/runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config.js');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config.js');
  }
}

// ─── Global Error Capture ────────────────────────────────────────────────────
// `onRequestError` is called by Next.js for ANY unhandled server error.
// This replaces the need to manually wrap every route handler with try/catch
// Sentry logic — it's automatic and covers the entire server surface.

export { captureRequestError as onRequestError } from '@sentry/nextjs';
