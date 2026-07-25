// ─── Prisma Configuration (v7) ───────────────────────────────────────────────
// In Prisma 7, the database connection URL is configured here instead of
// in schema.prisma. This file is used by the Prisma CLI (prisma generate,
// prisma db push, prisma migrate, etc.).
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load env vars from .env.local (Next.js convention).
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

export default defineConfig({
  schema: 'prisma/schema.prisma',

  // CLI uses this URL for migrations, introspection, and schema push.
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
});
