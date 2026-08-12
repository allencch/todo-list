import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems } from '@/db/schema';

const { fastify } = await import('@/index');

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
});
