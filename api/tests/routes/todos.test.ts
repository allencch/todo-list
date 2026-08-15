import { describe, it, expect } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems, todoItemDependencies } from '@/db/schema';

const { fastify } = await import('@/index');

describe('GET /api/todos', () => {
  it('list todo items', async () => {
    const [seeded] = await db.insert(todoItems).values({ name: 'Test todo' }).returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: seeded.id, name: 'Test todo' })]),
    );

    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });

  it('filters by status', async () => {
    const [matching] = await db
      .insert(todoItems)
      .values({ name: 'Filter status match', status: 'completed' })
      .returning();
    const [nonMatching] = await db
      .insert(todoItems)
      .values({ name: 'Filter status no match', status: 'not_started' })
      .returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { status: 'completed' },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids).toContain(matching.id);
    expect(ids).not.toContain(nonMatching.id);

    await db.delete(todoItems).where(eq(todoItems.id, matching.id));
    await db.delete(todoItems).where(eq(todoItems.id, nonMatching.id));
  });

  it('filters by priority', async () => {
    const [matching] = await db
      .insert(todoItems)
      .values({ name: 'Filter priority match', priority: 'high' })
      .returning();
    const [nonMatching] = await db
      .insert(todoItems)
      .values({ name: 'Filter priority no match', priority: 'low' })
      .returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { priority: 'high' },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids).toContain(matching.id);
    expect(ids).not.toContain(nonMatching.id);

    await db.delete(todoItems).where(eq(todoItems.id, matching.id));
    await db.delete(todoItems).where(eq(todoItems.id, nonMatching.id));
  });

  it('filters by content (partial, case-insensitive)', async () => {
    const [matching] = await db.insert(todoItems).values({ name: 'Buy Groceries' }).returning();
    const [nonMatching] = await db.insert(todoItems).values({ name: 'Walk the dog' }).returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { content: 'groceries' },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids).toContain(matching.id);
    expect(ids).not.toContain(nonMatching.id);

    await db.delete(todoItems).where(eq(todoItems.id, matching.id));
    await db.delete(todoItems).where(eq(todoItems.id, nonMatching.id));
  });

  it('filters by due date range', async () => {
    const [matching] = await db
      .insert(todoItems)
      .values({ name: 'Due in range', dueDate: new Date('2026-03-10T00:00:00.000Z') })
      .returning();
    const [nonMatching] = await db
      .insert(todoItems)
      .values({ name: 'Due out of range', dueDate: new Date('2026-04-10T00:00:00.000Z') })
      .returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { dueDateMin: '2026-03-01', dueDateMax: '2026-03-31' },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids).toContain(matching.id);
    expect(ids).not.toContain(nonMatching.id);

    await db.delete(todoItems).where(eq(todoItems.id, matching.id));
    await db.delete(todoItems).where(eq(todoItems.id, nonMatching.id));
  });

  it('sorts by name ascending', async () => {
    const [b] = await db.insert(todoItems).values({ name: 'Sort name B' }).returning();
    const [a] = await db.insert(todoItems).values({ name: 'Sort name A' }).returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { sortBy: 'name', sortOrder: 'asc' },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids.indexOf(a.id)).toBeLessThan(ids.indexOf(b.id));

    await db.delete(todoItems).where(eq(todoItems.id, a.id));
    await db.delete(todoItems).where(eq(todoItems.id, b.id));
  });

  it('sorts by priority in low, medium, high order', async () => {
    const [high] = await db
      .insert(todoItems)
      .values({ name: 'Sort priority high', priority: 'high' })
      .returning();
    const [low] = await db
      .insert(todoItems)
      .values({ name: 'Sort priority low', priority: 'low' })
      .returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { sortBy: 'priority', sortOrder: 'asc' },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids.indexOf(low.id)).toBeLessThan(ids.indexOf(high.id));

    await db.delete(todoItems).where(eq(todoItems.id, high.id));
    await db.delete(todoItems).where(eq(todoItems.id, low.id));
  });

  it('limits the number of results', async () => {
    const seeded = await db
      .insert(todoItems)
      .values([
        { name: 'Limit cap test 1' },
        { name: 'Limit cap test 2' },
        { name: 'Limit cap test 3' },
      ])
      .returning();

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { content: 'Limit cap test', limit: '2' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(2);

    await db.delete(todoItems).where(eq(todoItems.id, seeded[0].id));
    await db.delete(todoItems).where(eq(todoItems.id, seeded[1].id));
    await db.delete(todoItems).where(eq(todoItems.id, seeded[2].id));
  });

  it('excludes the given todo and its existing dependencies', async () => {
    const [dependent] = await db
      .insert(todoItems)
      .values({ name: 'Exclude scope test dependent' })
      .returning();
    const [dependency] = await db
      .insert(todoItems)
      .values({ name: 'Exclude scope test dependency' })
      .returning();
    const [unrelated] = await db
      .insert(todoItems)
      .values({ name: 'Exclude scope test unrelated' })
      .returning();
    await db
      .insert(todoItemDependencies)
      .values({ todoItemId: dependent.id, dependencyId: dependency.id });

    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: { content: 'Exclude scope test', excludeId: String(dependent.id) },
    });

    expect(response.statusCode).toBe(200);
    const ids = response.json().map((todo) => todo.id);
    expect(ids).toContain(unrelated.id);
    expect(ids).not.toContain(dependent.id);
    expect(ids).not.toContain(dependency.id);

    await db.delete(todoItemDependencies).where(eq(todoItemDependencies.todoItemId, dependent.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependent.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
    await db.delete(todoItems).where(eq(todoItems.id, unrelated.id));
  });

  it('paginates through results with a cursor', async () => {
    const seeded = await db
      .insert(todoItems)
      .values([
        { name: 'Cursor page test Alpha' },
        { name: 'Cursor page test Bravo' },
        { name: 'Cursor page test Charlie' },
      ])
      .returning();

    const firstPage = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: {
        content: 'Cursor page test',
        sortBy: 'name',
        sortOrder: 'asc',
        pageSize: '2',
      },
    });

    expect(firstPage.statusCode).toBe(200);
    const firstBody = firstPage.json();
    expect(firstBody.data.map((todo) => todo.name)).toEqual([
      'Cursor page test Alpha',
      'Cursor page test Bravo',
    ]);
    expect(firstBody.nextCursor).toBeTruthy();

    const secondPage = await fastify.inject({
      method: 'GET',
      url: '/api/todos',
      query: {
        content: 'Cursor page test',
        sortBy: 'name',
        sortOrder: 'asc',
        pageSize: '2',
        cursor: firstBody.nextCursor,
      },
    });

    expect(secondPage.statusCode).toBe(200);
    const secondBody = secondPage.json();
    expect(secondBody.data.map((todo) => todo.name)).toEqual(['Cursor page test Charlie']);
    expect(secondBody.nextCursor).toBeFalsy();

    await db.delete(todoItems).where(eq(todoItems.id, seeded[0].id));
    await db.delete(todoItems).where(eq(todoItems.id, seeded[1].id));
    await db.delete(todoItems).where(eq(todoItems.id, seeded[2].id));
  });
});

describe('GET /api/todos/:id', () => {
  it('get todo item', async () => {
    const [seeded] = await db.insert(todoItems).values({ name: 'Test todo' }).returning();

    const response = await fastify.inject({
      method: 'GET',
      url: `/api/todos/${seeded.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual(expect.objectContaining({ id: seeded.id, name: 'Test todo' }));

    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });

  it('returns 404 for a non-existent todo item', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/todos/999999',
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('POST /api/todos', () => {
  it('creates a todo item', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/todos',
      payload: { name: 'Test todo' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.name).toBe('Test todo');

    await db.delete(todoItems).where(eq(todoItems.id, body.id));
  });

  it('returns 400 for an invalid payload', async () => {
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/todos',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('PATCH /api/todos/:id', () => {
  it('updates a todo item', async () => {
    const [seeded] = await db.insert(todoItems).values({ name: 'Test todo' }).returning();

    const response = await fastify.inject({
      method: 'PATCH',
      url: `/api/todos/${seeded.id}`,
      payload: { name: 'Updated todo' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toEqual(expect.objectContaining({ id: seeded.id, name: 'Updated todo' }));

    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });

  it('updates recurCustom value', async () => {
    const [seeded] = await db
      .insert(todoItems)
      .values({
        name: 'Custom recurring todo',
        recurType: 'custom',
        recurCustom: { type: 'weekly', weekdays: [1, 3, 5] },
      })
      .returning();

    const response = await fastify.inject({
      method: 'PATCH',
      url: `/api/todos/${seeded.id}`,
      payload: { recurCustom: { type: 'monthly', monthDays: [1, 15] } },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.recurCustom).toEqual({ type: 'monthly', monthDays: [1, 15] });

    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });
});

describe('DELETE /api/todos/:id', () => {
  it('destroy a todo item', async () => {
    const [seeded] = await db.insert(todoItems).values({ name: 'Test todo' }).returning();
    const response = await fastify.inject({
      method: 'DELETE',
      url: `/api/todos/${seeded.id}`,
    });
    expect(response.statusCode).toBe(204);

    const [found] = await db.select().from(todoItems).where(eq(todoItems.id, seeded.id));
    expect(found).toBeUndefined();
  });
});

describe('POST /api/todos/:id/status', () => {
  it('marks the todo completed and creates new recurring todo', async () => {
    const [seeded] = await db
      .insert(todoItems)
      .values({
        name: 'Daily todo',
        recurType: 'daily',
        dueDate: new Date('2026-01-01T00:00:00.000Z'),
      })
      .returning();

    const response = await fastify.inject({
      method: 'POST',
      url: `/api/todos/${seeded.id}/status`,
      payload: { status: 'completed' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.status).toBe('completed');

    const [child] = await db.select().from(todoItems).where(eq(todoItems.parentId, seeded.id));
    expect(child).toBeDefined();
    expect(child.name).toBe('Daily todo');

    await db.delete(todoItems).where(eq(todoItems.id, child.id));
    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });

  it('changes status to in_progress when there are no dependencies', async () => {
    const [todo] = await db.insert(todoItems).values({ name: 'Ready to start' }).returning();

    const response = await fastify.inject({
      method: 'POST',
      url: `/api/todos/${todo.id}/status`,
      payload: { status: 'in_progress' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('in_progress');

    await db.delete(todoItems).where(eq(todoItems.id, todo.id));
  });

  it('rejects changing to in_progress when a dependency is not completed', async () => {
    const [todo] = await db.insert(todoItems).values({ name: 'Blocked todo' }).returning();
    const [dependency] = await db
      .insert(todoItems)
      .values({ name: 'Unfinished dependency' })
      .returning();
    await db
      .insert(todoItemDependencies)
      .values({ todoItemId: todo.id, dependencyId: dependency.id });

    const response = await fastify.inject({
      method: 'POST',
      url: `/api/todos/${todo.id}/status`,
      payload: { status: 'in_progress' },
    });

    expect(response.statusCode).toBe(400);

    const [unchanged] = await db.select().from(todoItems).where(eq(todoItems.id, todo.id));
    expect(unchanged.status).toBe('not_started');

    await db.delete(todoItemDependencies).where(eq(todoItemDependencies.todoItemId, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
  });

  it('allows changing to in_progress when all dependencies are completed', async () => {
    const [todo] = await db.insert(todoItems).values({ name: 'Unblocked todo' }).returning();
    const [dependency] = await db
      .insert(todoItems)
      .values({ name: 'Finished dependency', status: 'completed' })
      .returning();
    await db
      .insert(todoItemDependencies)
      .values({ todoItemId: todo.id, dependencyId: dependency.id });

    const response = await fastify.inject({
      method: 'POST',
      url: `/api/todos/${todo.id}/status`,
      payload: { status: 'in_progress' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('in_progress');

    await db.delete(todoItemDependencies).where(eq(todoItemDependencies.todoItemId, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
  });
});

describe('POST /api/todos/:id/dependencies/:dependencyId', () => {
  it('adds a dependency to a todo item', async () => {
    const [todo] = await db.insert(todoItems).values({ name: 'Build frontend' }).returning();
    const [dependency] = await db
      .insert(todoItems)
      .values({ name: 'Design frontend' })
      .returning();

    const response = await fastify.inject({
      method: 'POST',
      url: `/api/todos/${todo.id}/dependencies/${dependency.id}`,
    });

    expect(response.statusCode).toBe(204);

    const [link] = await db
      .select()
      .from(todoItemDependencies)
      .where(
        and(
          eq(todoItemDependencies.todoItemId, todo.id),
          eq(todoItemDependencies.dependencyId, dependency.id),
        ),
      );
    expect(link).toBeDefined();

    await db.delete(todoItemDependencies).where(eq(todoItemDependencies.todoItemId, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
  });
});

describe('DELETE /api/todos/:id/dependencies/:dependencyId', () => {
  it('removes a dependency from a todo item', async () => {
    const [todo] = await db.insert(todoItems).values({ name: 'Build frontend' }).returning();
    const [dependency] = await db
      .insert(todoItems)
      .values({ name: 'Design frontend' })
      .returning();
    await db
      .insert(todoItemDependencies)
      .values({ todoItemId: todo.id, dependencyId: dependency.id });

    const response = await fastify.inject({
      method: 'DELETE',
      url: `/api/todos/${todo.id}/dependencies/${dependency.id}`,
    });

    expect(response.statusCode).toBe(204);

    const [link] = await db
      .select()
      .from(todoItemDependencies)
      .where(
        and(
          eq(todoItemDependencies.todoItemId, todo.id),
          eq(todoItemDependencies.dependencyId, dependency.id),
        ),
      );
    expect(link).toBeUndefined();

    await db.delete(todoItems).where(eq(todoItems.id, todo.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
  });
});
