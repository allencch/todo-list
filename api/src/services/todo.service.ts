import { eq, isNull, and, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { todoItems, TodoItem } from '@/db/schema';
import type { CustomRecurrence } from '@/modules/todo.types';

const RECURRING_TYPES = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];

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
      return null;
  }
}

function getNextCustomDueDate(
  dueDate: Date | null,
  recurCustom: CustomRecurrence | null,
): Date | null {
  if (!dueDate || !recurCustom) return null;

  const matches =
    recurCustom.type === 'weekly'
      ? (date: Date) => recurCustom.weekdays.includes(date.getDay())
      : (date: Date) => recurCustom.monthDays.includes(date.getDate());

  const next = new Date(dueDate);
  // Bounded by a year -- guarantees a match since any valid weekday/month-day recurs within 366 days.
  for (let i = 0; i < 366; i++) {
    next.setDate(next.getDate() + 1);
    if (matches(next)) {
      return next;
    }
  }

  return null;
}

export async function completeTodo(todo: TodoItem, version: number | null = null) {
  const conditions = [eq(todoItems.id, todo.id)];
  if (version !== null) {
    conditions.push(eq(todoItems.version, version));
  }

  const [updated] = await db
    .update(todoItems)
    .set({
      status: 'completed',
      version: sql`${todoItems.version} + 1`,
     })
    .where(
      and(...conditions)
    )
    .returning();

  if (RECURRING_TYPES.includes(todo.recurType)) {
    const recurValue = todo.recurValue ?? 1;
    const nextDueDate =
      todo.recurType === 'custom'
        ? getNextCustomDueDate(todo.dueDate, todo.recurCustom as CustomRecurrence | null)
        : getNextDueDate(todo.dueDate, todo.recurType, recurValue);

    await db
      .insert(todoItems)
      .values({
        name: todo.name,
        description: todo.description,
        dueDate: nextDueDate,
        priority: todo.priority,
        isAllDay: todo.isAllDay,
        recurType: todo.recurType,
        recurValue: todo.recurValue,
        recurCustom: todo.recurCustom,
        parentId: todo.id,
      })
      .onConflictDoNothing({ target: todoItems.parentId, where: isNull(todoItems.deletedAt) });
  }

  return updated;
}
