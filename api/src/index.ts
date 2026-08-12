import Fastify from 'fastify';
import 'dotenv/config';
import { z } from 'zod';
import { db } from '@/db/client';
import { todoItems } from '@/db/schema';

export const fastify = Fastify({ logger: true });

const createTodoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

fastify.get('/api/health', async () => {
  return { status: 'ok' };
});

fastify.post('/api/todos', async (request, reply) => {
  const parsed = createTodoSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const [todo] = await db.insert(todoItems).values(parsed.data).returning();
  reply.code(201);
  return todo;
});

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
