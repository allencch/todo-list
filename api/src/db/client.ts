import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { env } from '../config/env';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
});

export const db = drizzle(pool);
