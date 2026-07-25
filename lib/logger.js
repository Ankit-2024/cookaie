import pino from 'pino';

// ─── Pino Structured Logger ─────────────────────────────────────────────────
// Outputs strict JSON in production (essential for Cloud Logging, Datadog,
// ELK, etc.) and human-readable output in development.
//
// Every log line includes:
//   • `service`  — always "cookaie" for filtering in multi-service stacks
//   • `env`      — "production", "development", etc.
//   • `time`     — ISO 8601 timestamp (epoch ms by default, overridden below)
//
// Usage:
//   import { logger, createLogger } from '@/lib/logger';
//   const log = createLogger('api:recipe');
//   log.info({ durationMs: 312 }, 'Gemini API call completed');
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Root logger instance.
 * Use `createLogger(component)` for per-module child loggers.
 */
export const logger = pino({
  // Log level: configurable via LOG_LEVEL env var.
  // Defaults to 'info' in production, 'debug' in development.
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Add base fields to every log line for filtering and correlation.
  base: {
    service: 'cookaie',
    env: process.env.NODE_ENV || 'development',
  },

  // Use ISO timestamps instead of epoch ms for human readability
  // in cloud log viewers (GCP, AWS CloudWatch, Datadog all parse ISO).
  timestamp: pino.stdTimeFunctions.isoTime,

  // In production, Pino outputs raw JSON by default (no config needed).
  // The `formatters` block ensures consistent field naming.
  formatters: {
    // Hoist the `level` field to a human-readable string ("info", "error")
    // instead of the default numeric value (30, 50).
    level(label) {
      return { level: label };
    },
  },
});

// ─── Child Logger Factory ────────────────────────────────────────────────────

/**
 * Creates a child logger with a `component` field for per-module context.
 *
 * @param {string} component - Identifies the module/route (e.g., 'api:recipe', 'api:cart').
 * @returns {pino.Logger} A child logger instance.
 *
 * @example
 *   const log = createLogger('api:recipe');
 *   log.info({ query: 'biryani' }, 'Recipe search started');
 *   // → {"level":"info","time":"2026-...","service":"cookaie","component":"api:recipe","query":"biryani","msg":"Recipe search started"}
 */
export function createLogger(component) {
  return logger.child({ component });
}
