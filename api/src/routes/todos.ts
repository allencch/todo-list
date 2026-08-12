import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { todoItems } from '@/db/schema';
import { db } from '@/db/client';

const createTodoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

async function createTodo(request, reply) {
  const parsed = createTodoSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const [todo] = await db.insert(todoItems).values(parsed.data).returning();
  reply.code(201);
  return todo;
}

// TODO: Add pagination, sorting, filtering
async function listTodos(request, reply) {
  const todos = await db.select().from(todoItems);
  reply.code(200);
  return todos;
}

async function getTodo(request, reply) {
  const { id } = request.params;
  const [todo] = await db.select().from(todoItems).where(eq(todoItems.id, id));
  reply.code(200);
  return todo;
}

async function todoRoutes(fastify, options) {
  fastify.get('', listTodos);
  fastify.get('/:id', getTodo);
  fastify.post('', createTodo);
}

export { todoRoutes };
