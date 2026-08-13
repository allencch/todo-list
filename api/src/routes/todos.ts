import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { todoItems } from '@/db/schema';
import { db } from '@/db/client';
import { completeTodo } from '@/services/todo.service';

const createTodoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const updateTodoSchema = createTodoSchema.partial().extend({
  status: z.enum(['not_started', 'in_progress', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
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
  const todos = await db.select().from(todoItems).orderBy(desc(todoItems.id));
  reply.code(200);
  return todos;
}

async function getTodo(request, reply) {
  const { id } = request.params;
  const todoId = Number(id);
  if (!Number.isInteger(todoId)) {
    reply.code(400);
    return { error: 'Invalid id' };
  }

  const [todo] = await db
    .select()
    .from(todoItems)
    .where(eq(todoItems.id, todoId));
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
  const todoId = Number(id);
  if (!Number.isInteger(todoId)) {
    reply.code(400);
    return { error: 'Invalid id' };
  }

  const [todo] = await db
    .update(todoItems)
    .set(parsed.data)
    .where(eq(todoItems.id, todoId))
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
  const todoId = Number(id);
  if (!Number.isInteger(todoId)) {
    reply.code(400);
    return { error: 'Invalid id' };
  }

  const [todo] = await db.select().from(todoItems).where(eq(todoItems.id, todoId));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }
  await db.delete(todoItems).where(eq(todoItems.id, todoId));
  return reply.status(204).send();
}

async function postCompleteTodo(request, reply) {
  const { id } = request.params;
  const todoId = Number(id);
  if (!Number.isInteger(todoId)) {
    reply.code(400);
    return { error: 'Invalid id' };
  }
  const [todo] = await db.select().from(todoItems).where(eq(todoItems.id, todoId));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  if (todo.status === 'completed') {
    // Do nothing
    reply.code(200);
    return todo;
  }

  const updated = await completeTodo(todo);
  reply.code(200);
  return updated;
}

async function todoRoutes(fastify, options) {
  fastify.get('', listTodos);
  fastify.get('/:id', getTodo);
  fastify.post('', createTodo);
  fastify.patch('/:id', updateTodo);
  fastify.delete('/:id', deleteTodo);
  fastify.post('/:id/complete', postCompleteTodo);
}

export { todoRoutes };
