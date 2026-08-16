import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import apiRoutes from './routes';

const __dirname = dirname(fileURLToPath(import.meta.url));
const openapiPath = join(__dirname, '..', 'openapi.yaml');

export const fastify = Fastify({ logger: process.env.NODE_ENV !== 'test' });

// Do not enable CORS by default. The web proxy should handle it.
// Use this for testing Swagger
fastify.register(cors, { origin: process.env.ENABLE_CORS === '1' });

fastify.get('/api/health', async () => {
  return { status: 'ok' };
});

fastify.get('/api/openapi.yaml', async (request, reply) => {
  reply.type('text/yaml').send(readFileSync(openapiPath, 'utf-8'));
});

fastify.register(apiRoutes, { prefix: '/api' });

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
