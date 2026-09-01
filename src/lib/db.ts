import { PrismaClient } from '@prisma/client';

const SUPABASE_DIRECT_URL = "postgresql://votely_admin:VotelySecurePass123!@db.vvvabdtgomzbyzjgkgiw.supabase.co:5432/postgres?sslmode=require";

function getActiveDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || SUPABASE_DIRECT_URL;
  // Automatically fix port 6543 to direct port 5432
  if (url.includes('supabase.co:6543')) {
    url = url.replace(':6543', ':5432')
      .replace('&pgbouncer=true', '')
      .replace('?pgbouncer=true&', '?')
      .replace('?pgbouncer=true', '');
  }
  return url;
}

const activeUrl = getActiveDatabaseUrl();
process.env.DATABASE_URL = activeUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
