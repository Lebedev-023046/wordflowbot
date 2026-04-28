import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '../../../app/config/env';

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
  });

  return new PrismaClient({
    adapter,
  });
}
