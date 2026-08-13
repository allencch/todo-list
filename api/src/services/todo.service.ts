import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems, TodoItem } from '@/db/schema';

function getNextDueDate(dueDate: Date | null, recurType: string): Date | null {
  if (!dueDate) return null;

  const next = new Date(dueDate);
  switch (recurType) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      return next;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    default:
      // TODO: 'custom' recurrence isn't implemented yet -- recurCustom's shape is undecided.
      return null;
  }
}

export async function completeTodo(todo: TodoItem) {
  const [updated] = await db
    .update(todoItems)
    .set({ status: 'completed' })
    .where(eq(todoItems.id, todo.id))
    .returning();

  if (todo.recurType === 'daily' || todo.recurType === 'weekly' || todo.recurType === 'monthly') {
    await db.insert(todoItems).values({
      name: todo.name,
      description: todo.description,
      dueDate: getNextDueDate(todo.dueDate, todo.recurType),
      priority: todo.priority,
      isAllDay: todo.isAllDay,
      recurType: todo.recurType,
      recurCustom: todo.recurCustom,
      parentId: todo.id,
    });
  }

  return updated;
}
