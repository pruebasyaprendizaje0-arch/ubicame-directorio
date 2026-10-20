import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Singleton para el pool de conexiones de PostgreSQL
 * Reutiliza conexiones y configura timeouts y SSL de forma resiliente
 */
export function getDbPool(): Pool {
  if (!pool) {
    const isInternalDocker = !process.env.DATABASE_URL?.includes('sslmode=require');
    const sslConfig = process.env.DATABASE_SSL === 'true' 
      ? { rejectUnauthorized: false } 
      : (process.env.DATABASE_SSL === 'false' || isInternalDocker ? false : { rejectUnauthorized: false });

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('⚠️ [PostgreSQL Pool Error]:', err);
    });
  }
  return pool;
}
