import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems, TodoItem } from '@/db/schema';

const RECURRING_TYPES = ['daily', 'weekly', 'monthly', 'yearly'];

function getNextDueDate(dueDate: Date | null, recurType: string, recurValue: number): Date | null {
  if (!dueDate) return null;

  const next = new Date(dueDate);
  switch (recurType) {
    case 'daily':
      next.setDate(next.getDate() + recurValue);
      return next;
    case 'weekly':
      next.setDate(next.getDate() + recurValue * 7);
      return next;
    case 'monthly':
      next.setMonth(next.getMonth() + recurValue);
      return next;
    case 'yearly':
      next.setFullYear(next.getFullYear() + recurValue);
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

  if (RECURRING_TYPES.includes(todo.recurType)) {
    const recurValue = todo.recurValue ?? 1;
    await db.insert(todoItems).values({
      name: todo.name,
      description: todo.description,
      dueDate: getNextDueDate(todo.dueDate, todo.recurType, recurValue),
      priority: todo.priority,
      isAllDay: todo.isAllDay,
      recurType: todo.recurType,
      recurValue: todo.recurValue,
      recurCustom: todo.recurCustom,
      parentId: todo.id,
    });
  }

  return updated;
}
