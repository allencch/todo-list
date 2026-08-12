import { z } from 'zod';
import { todoItems } from '@/db/schema';
import { db } from '@/db/client';

const createTodoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

async function todoRoutes(fastify, options) {
  fastify.post('', async (request, reply) => {
    const parsed = createTodoSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: parsed.error.flatten() };
    }

    const [todo] = await db.insert(todoItems).values(parsed.data).returning();
    reply.code(201);
    return todo;
  });
}

export { todoRoutes };
