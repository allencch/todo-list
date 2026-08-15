import {
  eq,
  asc,
  desc,
  gt,
  lt,
  isNull,
  inArray,
  notInArray,
  and,
  or,
  ilike,
  gte,
  lte,
  sql,
} from 'drizzle-orm';
import { todoItems, todoItemDependencies } from '@/db/schema';
import { db } from '@/db/client';
import { completeTodo } from '@/services/todo.service';
import {
  createTodoSchema,
  updateTodoSchema,
  listTodosQuerySchema,
  addDependencySchema,
  idParamSchema,
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

const dateSortColumns = new Set(['dueDate', 'createdAt']);

function encodeCursor(value, id) {
  return Buffer.from(JSON.stringify({ value, id })).toString('base64url');
}

function decodeCursor(cursor, sortBy) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
    const value = sortBy && dateSortColumns.has(sortBy) && decoded.value !== null
      ? new Date(decoded.value)
      : decoded.value;
    return { value, id: decoded.id };
  } catch {
    return null;
  }
}

function cursorValueFromTodo(todo, sortBy) {
  return sortBy ? (todo[sortBy] ?? null) : todo.id;
}

// Builds the "keyset" WHERE clause for the row after `cursor`, given the same
// sortBy/sortOrder used to build the ORDER BY. Requires an `id` tiebreak on ties
// (and, for the nullable `priority` column, a NULLS LAST-aware null branch).
function buildCursorCondition(sortBy, sortOrder, cursor) {
  const cmp = sortOrder === 'asc' ? gt : lt;

  if (!sortBy) {
    return lt(todoItems.id, cursor.id);
  }

  const column = sortColumns[sortBy];

  if (sortBy === 'priority') {
    if (cursor.value === null) {
      return and(isNull(column), cmp(todoItems.id, cursor.id));
    }
    return or(isNull(column), cmp(column, cursor.value), and(eq(column, cursor.value), cmp(todoItems.id, cursor.id)));
  }

  return or(cmp(column, cursor.value), and(eq(column, cursor.value), cmp(todoItems.id, cursor.id)));
}

async function listTodos(request, reply) {
  const parsed = listTodosQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const {
    status,
    priority,
    content,
    dueDateMin,
    dueDateMax,
    sortBy,
    sortOrder,
    limit,
    excludeId,
    pageSize,
    cursor,
  } = parsed.data;

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

  if (excludeId) {
    const existingDependencies = await db
      .select({ dependencyId: todoItemDependencies.dependencyId })
      .from(todoItemDependencies)
      .where(eq(todoItemDependencies.todoItemId, excludeId));

    const excludedIds = [excludeId, ...existingDependencies.map((link) => link.dependencyId)];
    conditions.push(notInArray(todoItems.id, excludedIds));
  }

  let decodedCursor;
  if (cursor) {
    decodedCursor = decodeCursor(cursor, sortBy);
    if (!decodedCursor) {
      reply.code(400);
      return { error: 'Invalid cursor' };
    }
    conditions.push(buildCursorCondition(sortBy, sortOrder, decodedCursor));
  }

  const orderFn = sortOrder === 'asc' ? asc : desc;
  let orderBy;
  if (sortBy === 'priority') {
    orderBy =
      sortOrder === 'asc'
        ? [sql`${todoItems.priority} ASC NULLS LAST`, asc(todoItems.id)]
        : [sql`${todoItems.priority} DESC NULLS LAST`, desc(todoItems.id)];
  } else if (sortBy) {
    orderBy = [orderFn(sortColumns[sortBy]), orderFn(todoItems.id)];
  } else {
    orderBy = [desc(todoItems.id)];
  }

  let query = db
    .select()
    .from(todoItems)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .$dynamic();

  if (pageSize) {
    query = query.limit(pageSize + 1);
  } else if (limit) {
    query = query.limit(limit);
  }

  const rows = await query;

  reply.code(200);

  if (pageSize) {
    const hasMore = rows.length > pageSize;
    const page = hasMore ? rows.slice(0, pageSize) : rows;
    const data = await attachNextDueDates(page);
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(cursorValueFromTodo(last, sortBy), last.id) : null;
    return { data, nextCursor };
  }

  return attachNextDueDates(rows);
}

async function getTodo(request, reply) {
  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;

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

  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;

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
  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;

  const [todo] = await db.select().from(todoItems).where(eq(todoItems.id, todoId));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }
  await db.delete(todoItems).where(eq(todoItems.id, todoId));
  return reply.status(204).send();
}

async function postCompleteTodo(request, reply) {
  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;
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

  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;

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

// async function removeDependency(request, reply) {
//   const { id, dependencyId } = request.params;
// }

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
