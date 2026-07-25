// ─── Next.js Client Instrumentation ─────────────────────────────────────────
// This file runs in the browser BEFORE React hydration. It initializes
// Sentry's client-side SDK to capture:
//   • Unhandled exceptions and promise rejections
//   • Performance traces (page loads, navigations)
//   • Session replays on error
//
// Placement: project root (next to next.config.mjs)
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from '@sentry/nextjs';
import './sentry.client.config.js';

// ─── Navigation Tracking ────────────────────────────────────────────────────
// Required by @sentry/nextjs to instrument App Router navigations.
// This hook fires on every client-side route transition and creates a
// Sentry transaction span for navigation performance monitoring.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
