import { PrismaClient } from '@prisma/client';

/**
 * Shared PrismaClient Singleton instance.
 * Avoids exhausting database connection pool limits.
 */
export const prisma = new PrismaClient();
