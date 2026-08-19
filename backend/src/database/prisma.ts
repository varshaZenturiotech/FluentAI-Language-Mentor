import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Ensure environment variables are loaded before database pool initialization
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Override dns.lookup to force IPv4 (family: 4) resolution for node-postgres
// This prevents IPv6 ENETUNREACH connection attempt timeouts on local networks
const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = function (hostname: string, options: any, callback: any) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return originalLookup(hostname, { ...options, family: 4 }, callback);
};

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
