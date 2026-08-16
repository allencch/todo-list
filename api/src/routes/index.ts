import { todoRoutes } from './todos';
import { aiRoutes } from './ai';

async function apiRoutes(fastify, options) {
  await fastify.register(todoRoutes, { prefix: '/todos' });
  await fastify.register(aiRoutes);
}

export default apiRoutes;
