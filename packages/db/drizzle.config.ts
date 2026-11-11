import { defineConfig } from 'drizzle-kit';

// drizzle-kit no lee el .env de la raíz; en CI no existe y DATABASE_URL viene del entorno.
try {
  process.loadEnvFile('../../.env');
} catch {}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  casing: 'snake_case',
});
