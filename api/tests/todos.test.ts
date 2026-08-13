import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems } from '@/db/schema';

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

describe('POST /api/todos/:id/complete', () => {
  it('mark the todo to complete and create new recurring todo', async () => {
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
      url: `/api/todos/${seeded.id}/complete`,
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
});
