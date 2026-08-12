import { todoRoutes } from './todos';

async function apiRoutes(fastify, options) {
  await fastify.register(todoRoutes, { prefix: '/todos' });
}

export default apiRoutes;
