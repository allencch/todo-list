import dotenv from 'dotenv';

dotenv.config({
  path: '.env.local',
});

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: Number(process.env.PORT ?? 3000),
};
