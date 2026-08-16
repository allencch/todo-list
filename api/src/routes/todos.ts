import {
  eq,
  ne,
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
  exists,
  notExists,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { todoItems, todoItemDependencies } from '@/db/schema';
import { db } from '@/db/client';
import { completeTodo } from '@/services/todo.service';
import { broadcastTodoChanged } from '@/ws';
import {
  createTodoSchema,
  updateTodoSchema,
  listTodosQuerySchema,
  idParamSchema,
  dependencyParamSchema,
  updateStatusSchema,
} from '@/schemas/todos.schema.js';

const dependencyTodoItems = alias(todoItems, 'dependency_todo_items');

function getClientId(request) {
  const header = request.headers['x-client-id'];
  return Array.isArray(header) ? header[0] : header;
}

// Called when a version-guarded UPDATE affects zero rows. Distinguishes the
// todo genuinely not existing (or being soft-deleted) from a real optimistic-lock
// conflict, so the client can tell "reload, it's gone" apart from "reload, it changed".
async function versionConflictReply(reply, todoId) {
  const [current] = await db.select().from(todoItems).where(eq(todoItems.id, todoId));
  if (!current || current.deletedAt) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  reply.code(409);
  return { error: 'This todo was modified by someone else. Please reload and try again.' };
}

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
  broadcastTodoChanged(todo.id, getClientId(request));
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
    dependencyStatus,
  } = parsed.data;

  const conditions = [isNull(todoItems.deletedAt)];
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

  if (dependencyStatus) {
    const incompleteDependencySubquery = db
      .select({ one: sql`1` })
      .from(todoItemDependencies)
      .innerJoin(dependencyTodoItems, eq(todoItemDependencies.dependencyId, dependencyTodoItems.id))
      .where(
        and(
          eq(todoItemDependencies.todoItemId, todoItems.id),
          isNull(dependencyTodoItems.deletedAt),
          ne(dependencyTodoItems.status, 'completed')
        )
      );

    if (dependencyStatus === 'blocked') {
      conditions.push(exists(incompleteDependencySubquery));
    } else {
      const anyDependencySubquery = db
        .select({ one: sql`1` })
        .from(todoItemDependencies)
        .innerJoin(dependencyTodoItems, eq(todoItemDependencies.dependencyId, dependencyTodoItems.id))
        .where(
          and(
            eq(todoItemDependencies.todoItemId, todoItems.id),
            isNull(dependencyTodoItems.deletedAt)
          )
        );

      conditions.push(and(exists(anyDependencySubquery), notExists(incompleteDependencySubquery)));
    }
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
    const data = await attachDependencies(await attachNextDueDates(page));
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor(cursorValueFromTodo(last, sortBy), last.id) : null;
    return { data, nextCursor };
  }

  return attachDependencies(await attachNextDueDates(rows));
}

async function attachDependencies(todos) {
  if (todos.length === 0) {
    return todos;
  }

  const links = await db
    .select({
      todoItemId: todoItemDependencies.todoItemId,
      id: todoItems.id,
      name: todoItems.name,
      status: todoItems.status,
    })
    .from(todoItemDependencies)
    .innerJoin(todoItems, eq(todoItemDependencies.dependencyId, todoItems.id))
    .where(
      and(
        inArray(todoItemDependencies.todoItemId, todos.map((todo) => todo.id)),
        isNull(todoItems.deletedAt)
      )
    );

  const dependenciesByTodoId = new Map();
  for (const { todoItemId, ...dependency } of links) {
    if (!dependenciesByTodoId.has(todoItemId)) {
      dependenciesByTodoId.set(todoItemId, []);
    }
    dependenciesByTodoId.get(todoItemId).push(dependency);
  }

  return todos.map((todo) => ({
    ...todo,
    dependencies: dependenciesByTodoId.get(todo.id) ?? [],
  }));
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
    .where(and(eq(todoItems.id, todoId), isNull(todoItems.deletedAt)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }
  reply.code(200);
  const [withNextDueDate] = await attachNextDueDates([todo]);
  const [withDependencies] = await attachDependencies([withNextDueDate]);
  return withDependencies;
}

async function updateTodo(request, reply) {
  const parsed = updateTodoSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }
  const { version } = parsed.data;

  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;

  const [todo] = await db
    .update(todoItems)
    .set({ ...parsed.data, version: sql`${todoItems.version} + 1` })
    .where(and(eq(todoItems.id, todoId), isNull(todoItems.deletedAt), eq(todoItems.version, version)))
    .returning();

  if (!todo) {
    return versionConflictReply(reply, todoId);
  }

  broadcastTodoChanged(todoId, getClientId(request));
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

  const [todo] = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.id, todoId), isNull(todoItems.deletedAt)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }
  await db.update(todoItems).set({
    deletedAt: sql`now()`,
    version: sql`${todoItems.version} + 1`, // update version as well, since this is soft delete
  }).where(eq(todoItems.id, todoId));
  broadcastTodoChanged(todoId, getClientId(request));
  return reply.status(204).send();
}

async function handleCompleteStatus(todo, reply, version, clientId) {
  if (todo.status === 'completed') {
    // Do nothing
    reply.code(200);
    return todo;
  }

  const updated = await completeTodo(todo, version);
  if (!updated) {
    return versionConflictReply(reply, todo.id);
  }

  broadcastTodoChanged(todo.id, clientId);
  reply.code(200);
  const [withNextDueDate] = await attachNextDueDates([updated]);
  return withNextDueDate;
}

async function handleInProgressStatus(todo, reply, version, clientId) {
  if (todo.status === 'in_progress') {
    reply.code(200);
    return todo;
  }

  const incompleteDependencies = await db
    .select({ id: todoItems.id, name: todoItems.name })
    .from(todoItemDependencies)
    .innerJoin(todoItems, eq(todoItemDependencies.dependencyId, todoItems.id))
    .where(
      and(
        eq(todoItemDependencies.todoItemId, todo.id),
        isNull(todoItems.deletedAt),
        notInArray(todoItems.status, ['completed'])
      )
    );

  if (incompleteDependencies.length > 0) {
    reply.code(400);
    return { error: 'Cannot start todo until all dependencies are completed', incompleteDependencies };
  }

  const [updated] = await db
    .update(todoItems)
    .set({
      status: 'in_progress',
      version: sql`${todoItems.version} + 1`,
     })
    .where(and(
      eq(todoItems.id, todo.id),
      eq(todoItems.version, version)
    ))
    .returning();

  if (!updated) {
    return versionConflictReply(reply, todo.id);
  }

  broadcastTodoChanged(todo.id, clientId);
  reply.code(200);
  return updated;
}

async function updateTodoStatus(request, reply) {
  const parsedParams = idParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }
  const { id: todoId } = parsedParams.data;

  const parsed = updateStatusSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }
  const { status, version } = parsed.data;
  const clientId = getClientId(request);

  const [todo] = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.id, todoId), isNull(todoItems.deletedAt)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  if (status === 'completed') {
    return handleCompleteStatus(todo, reply, version, clientId);
  }

  if (status === 'in_progress') {
    return handleInProgressStatus(todo, reply, version, clientId);
  }

  const [updated] = await db
    .update(todoItems)
    .set({
      status,
      version: sql`${todoItems.version} + 1`,
    })
    .where(and(
      eq(todoItems.id, todoId),
      eq(todoItems.version, version)
    ))
    .returning();

  if (!updated) {
    return versionConflictReply(reply, todoId);
  }

  broadcastTodoChanged(todoId, clientId);
  reply.code(200);
  return updated;
}

async function addDependency(request, reply) {
  const parsed = dependencyParamSchema.safeParse(request.params);
  if (!parsed.success) {
    reply.code(400);
    return { error: parsed.error.flatten() };
  }

  const { id: todoId, dependencyId } = parsed.data;

  if (todoId === dependencyId) {
    reply.code(400);
    return { error: 'A todo cannot depend on itself' };
  }

  const [todo] = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.id, todoId), isNull(todoItems.deletedAt)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  const [dependency] = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.id, dependencyId), isNull(todoItems.deletedAt)));
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
        eq(todoItemDependencies.dependencyId, dependencyId)
      )
    );
  if (existingLink) {
    reply.code(409);
    return { error: 'Dependency already exists' };
  }

  await db.insert(todoItemDependencies).values({
    todoItemId: todoId,
    dependencyId: dependencyId,
  });

  broadcastTodoChanged(todoId, getClientId(request));
  return reply.status(204).send();
}

async function removeDependency(request, reply) {
  const parsedParams = dependencyParamSchema.safeParse(request.params);
  if (!parsedParams.success) {
    reply.code(400);
    return { error: parsedParams.error.flatten() };
  }

  const { id: todoId, dependencyId } = parsedParams.data;

  const [todo] = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.id, todoId), isNull(todoItems.deletedAt)));
  if (!todo) {
    reply.code(404);
    return { error: 'Todo not found' };
  }

  const [dependency] = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.id, dependencyId), isNull(todoItems.deletedAt)));
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
        eq(todoItemDependencies.dependencyId, dependencyId)
      )
    );
  if (!existingLink) {
    reply.code(404);
    return { error: 'No dependency found' };
  }
  await db.delete(todoItemDependencies).where(
    and(
      eq(todoItemDependencies.todoItemId, todoId),
      eq(todoItemDependencies.dependencyId, dependencyId)
    )
  );

  broadcastTodoChanged(todoId, getClientId(request));
  return reply.code(204).send();
}

async function todoRoutes(fastify, options) {
  fastify.get('', listTodos);
  fastify.get('/:id', getTodo);
  fastify.post('', createTodo);
  fastify.patch('/:id', updateTodo);
  fastify.delete('/:id', deleteTodo);
  fastify.post('/:id/status', updateTodoStatus);
  fastify.post('/:id/dependencies/:dependencyId', addDependency);
  fastify.delete('/:id/dependencies/:dependencyId', removeDependency);
}

export { todoRoutes };
