import { eq, asc, desc, inArray, and, or, ilike, gte, lte, sql } from 'drizzle-orm';
import { todoItems, todoItemDependencies } from '@/db/schema';
import { db } from '@/db/client';
import { completeTodo } from '@/services/todo.service';
import {
  createTodoSchema,
  updateTodoSchema,
  listTodosQuerySchema,
  addDependencySchema,
} from '@/schemas/todos.schema.js';

async function attachNextDueDates(todos) {
  const completedIds = todos.filter((todo) => todo.status === 'completed').map((todo) => todo.id);
  if (completedIds.length === 0) {
    return todos.map((todo) => ({ ...todo, nextDueDate: null }));
  }

  const children = await db
    .select()
    .from(todoItems)
    .where(inArray(todoItems.parentId, completedIds));
  const nextDueDateByParentId = new Map(children.map((child) => [child.parentId, child.dueDate]));

  return todos.map((todo) => ({
    ...todo,
    nextDueDate: nextDueDateByParentId.get(todo.id) ?? null,
  }));
}

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

const sortColumns = {
  dueDate: todoItems.dueDate,
  priority: todoItems.priority,
  status: todoItems.status,
  name: todoItems.name,
  createdAt: todoItems.createdAt,
};

// TODO: Add pagination
async function listTodos(request, reply) {
  const parsed = listTodosQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const { status, priority, content, dueDateMin, dueDateMax, sortBy, sortOrder } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(todoItems.status, status));
  if (priority) conditions.push(eq(todoItems.priority, priority));
  if (content) {
    conditions.push(
      or(
        ilike(todoItems.name, `%${content}%`),
        ilike(todoItems.description, `%${content}%`)
      )
    );
  }
  if (dueDateMin) conditions.push(gte(todoItems.dueDate, dueDateMin));
  if (dueDateMax) conditions.push(lte(todoItems.dueDate, dueDateMax));

  const orderFn = sortOrder === 'asc' ? asc : desc;
  let orderBy;
  if (sortBy === 'priority') {
    orderBy =
      sortOrder === 'asc'
        ? sql`${todoItems.priority} ASC NULLS LAST`
        : sql`${todoItems.priority} DESC NULLS LAST`;
  } else if (sortBy) {
    orderBy = orderFn(sortColumns[sortBy]);
  } else {
    orderBy = desc(todoItems.id);
  }

  const todos = await db
    .select()
    .from(todoItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy);

  reply.code(200);
  return attachNextDueDates(todos);
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
  const [withNextDueDate] = await attachNextDueDates([todo]);
  return withNextDueDate;
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
  const [withNextDueDate] = await attachNextDueDates([updated]);
  return withNextDueDate;
}

async function addDependency(request, reply) {
  const parsed = addDependencySchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const { todoItemId } = parsed.data;

  const { id } = request.params;
  const todoId = Number(id);
  if (!Number.isInteger(todoId)) {
    reply.code(400);
    return { error: 'Invalid id' };
  }

  if (todoId === todoItemId) {
    reply.code(400);
    return { error: 'A todo cannot depend on itself' };
  }

  const [todo] = await db.select().from(todoItems).where(eq(todoItems.id, todoId));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  const [dependency] = await db.select().from(todoItems).where(eq(todoItems.id, todoItemId));
  if (!dependency) {
    reply.code(404);
    return { error: 'Dependency todo not found' };
  }

  const [existingLink] = await db
    .select()
    .from(todoItemDependencies)
    .where(
      and(
        eq(todoItemDependencies.todoItemId, todoId),
        eq(todoItemDependencies.dependencyId, todoItemId)
      )
    );
  if (existingLink) {
    reply.code(409);
    return { error: 'Dependency already exists' };
  }

  await db.insert(todoItemDependencies).values({
    todoItemId: todoId,
    dependencyId: todoItemId,
  });

  return reply.status(204).send();
}

async function todoRoutes(fastify, options) {
  fastify.get('', listTodos);
  fastify.get('/:id', getTodo);
  fastify.post('', createTodo);
  fastify.patch('/:id', updateTodo);
  fastify.delete('/:id', deleteTodo);
  fastify.post('/:id/complete', postCompleteTodo);
  fastify.post('/:id/dependencies', addDependency);
}

export { todoRoutes };
