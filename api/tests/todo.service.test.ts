import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems } from '@/db/schema';
import { completeTodo } from '@/services/todo.service';

describe('completeTodo', () => {
  it('marks a non-recurring todo as completed', async () => {
    const [seeded] = await db.insert(todoItems).values({ name: 'Test todo' }).returning();

    const result = await completeTodo(seeded);

    expect(result.status).toBe('completed');

    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });

  it('creates the next occurrence for a recurring todo', async () => {
    const dueDate = new Date('2026-01-01T00:00:00.000Z');
    const [seeded] = await db
      .insert(todoItems)
      .values({ name: 'Daily todo', recurType: 'daily', dueDate })
      .returning();

    const result = await completeTodo(seeded);
    expect(result.status).toBe('completed');

    const [child] = await db.select().from(todoItems).where(eq(todoItems.parentId, seeded.id));

    expect(child).toBeDefined();
    expect(child.name).toBe('Daily todo');
    expect(new Date(child.dueDate).toISOString()).toBe('2026-01-02T00:00:00.000Z');

    await db.delete(todoItems).where(eq(todoItems.id, child.id));
    await db.delete(todoItems).where(eq(todoItems.id, seeded.id));
  });
});
