import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ─── Prisma Client Singleton (Prisma 7 + Driver Adapter) ────────────────────
// Prisma 7 requires a driver adapter to connect to the database.
// We use `@prisma/adapter-pg` (node-postgres under the hood).
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis;

/**
 * Creates a PrismaClient with the PrismaPg driver adapter.
 * The adapter manages the underlying pg connection pool.
 */
function createPrismaClient() {
  const rawDbUrl = process.env.DATABASE_URL;
  const connectionString = rawDbUrl ? rawDbUrl.replace(/^["']|["']$/g, '').trim() : undefined;

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

/** @type {PrismaClient} */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Persist the instance across HMR in development.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
