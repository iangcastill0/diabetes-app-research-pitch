import { Pool, PoolClient, QueryResult } from 'pg';
import { DATABASE_CONFIG } from '@bb/config';

// Database connection pool
const pool = new Pool({
  host: DATABASE_CONFIG.HOST,
  port: DATABASE_CONFIG.PORT,
  database: DATABASE_CONFIG.NAME,
  user: DATABASE_CONFIG.USER,
  password: DATABASE_CONFIG.PASSWORD,
  max: DATABASE_CONFIG.POOL_SIZE,
  ssl: DATABASE_CONFIG.SSL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Connection error handling
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export interface QueryOptions {
  text: string;
  values?: unknown[];
}

// Execute a query
export const query = async <T>(
  text: string,
  values?: unknown[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const result = await pool.query<T>(text, values);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query:', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  
  return result;
};

// Get a client for transactions
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  
  // Monkey-patch the query method for logging
  const originalQuery = client.query.bind(client);
  
  // @ts-expect-error - extending client
  client.query = (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Client query:', args[0]);
    }
    // @ts-expect-error - dynamic args
    return originalQuery(...args);
  };
  
  return client;
};

// Transaction helper
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const result = await query('SELECT 1');
    return result.rowCount === 1;
  } catch (error) {
    return false;
  }
};

// Close pool (for graceful shutdown)
export const closePool = async (): Promise<void> => {
  await pool.end();
};

export { pool };
