/// <reference types="node" />

import { defineConfig } from 'prisma/config';

const migrationDatabaseUrl = process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: migrationDatabaseUrl,
  },
});
