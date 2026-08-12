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

const updateTodoSchema = createTodoSchema.partial();

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
  const [todo] = await db
    .select()
    .from(todoItems)
    .where(eq(todoItems.id, Number(id)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }
  reply.code(200);
  return todo;
}

async function updateTodo(request, reply) {
  const parsed = updateTodoSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const { id } = request.params;
  const [todo] = await db
    .update(todoItems)
    .set(parsed.data)
    .where(eq(todoItems.id, Number(id)))
    .returning();

  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  reply.code(200);
  return todo;
}

async function deleteTodo(request, reply) {
  const { id } = request.params;
  const [todo] = await db
    .select()
    .from(todoItems)
    .where(eq(todoItems.id, Number(id)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }
  await db.delete(todoItems).where(eq(todoItems.id, Number(id)));
  return reply.status(204).send();
}

async function todoRoutes(fastify, options) {
  fastify.get('', listTodos);
  fastify.get('/:id', getTodo);
  fastify.post('', createTodo);
  fastify.patch('/:id', updateTodo);
  fastify.delete('/:id', deleteTodo);
}

export { todoRoutes };
