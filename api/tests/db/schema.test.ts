import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems, todoItemDependencies } from '@/db/schema';

describe('todoItemDependencies', () => {
  it('todo item can add a dependency', async () => {
    const [todoItem] = await db.insert(todoItems).values({ name: 'Build frontend' }).returning();
    const [dependency] = await db.insert(todoItems).values({ name: 'Design frontend' }).returning();

    await db.insert(todoItemDependencies).values({
      todoItemId: todoItem.id,
      dependencyId: dependency.id,
    });

    const links = await db
      .select()
      .from(todoItemDependencies)
      .where(eq(todoItemDependencies.todoItemId, todoItem.id));

    expect(links).toEqual([
      expect.objectContaining({ todoItemId: todoItem.id, dependencyId: dependency.id }),
    ]);

    await db.delete(todoItemDependencies).where(eq(todoItemDependencies.todoItemId, todoItem.id));
    await db.delete(todoItems).where(eq(todoItems.id, todoItem.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
  });

  it('todo item can add a dependent', async () => {
    const [dependency] = await db.insert(todoItems).values({ name: 'Design backend' }).returning();
    const [todoItem] = await db.insert(todoItems).values({ name: 'Build backend' }).returning();

    await db.insert(todoItemDependencies).values({
      todoItemId: todoItem.id,
      dependencyId: dependency.id,
    });

    const dependents = await db
      .select()
      .from(todoItemDependencies)
      .where(eq(todoItemDependencies.dependencyId, dependency.id));

    expect(dependents).toEqual([
      expect.objectContaining({ todoItemId: todoItem.id, dependencyId: dependency.id }),
    ]);

    await db.delete(todoItemDependencies).where(eq(todoItemDependencies.dependencyId, dependency.id));
    await db.delete(todoItems).where(eq(todoItems.id, todoItem.id));
    await db.delete(todoItems).where(eq(todoItems.id, dependency.id));
  });
});
