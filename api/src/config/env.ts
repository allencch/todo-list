import dotenv from 'dotenv';

// .env.local loads first so its values win; .env (loaded second) only fills in
// keys that aren't already set, since dotenv never overwrites an existing value.
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: Number(process.env.PORT ?? 3000),
};
