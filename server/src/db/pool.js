import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root only in development (Vercel injects env vars in production)
if (process.env.NODE_ENV !== 'production') {
  const envPath = process.env.DOTENV_CONFIG_PATH
    ? resolve(process.env.DOTENV_CONFIG_PATH)
    : join(__dirname, '..', '..', '..', '.env.local');
  try {
    const envSource = readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = dotenv.parse(envSource);
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env file missing; rely on real environment variables
  }
}

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit in serverless environment - just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

export default pool;
