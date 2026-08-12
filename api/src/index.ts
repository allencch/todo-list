import Fastify from 'fastify';
import 'dotenv/config';
import apiRoutes from './routes'

export const fastify = Fastify({ logger: process.env.NODE_ENV !== 'test' });


fastify.get('/api/health', async () => {
  return { status: 'ok' };
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
