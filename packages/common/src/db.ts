import { PrismaClient } from '@prisma/client';
import path from 'path';
import dotenv from 'dotenv';

// Explicitly load .env from the common package directory
// Use ../.env because this file is in src/
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// Prevent multiple instances in dev
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export * from '@prisma/client';
