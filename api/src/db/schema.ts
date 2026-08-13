import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  jsonb,
  AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const statusEnum = pgEnum('status', ['not_started', 'in_progress', 'completed', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const recurEnum = pgEnum('recur', ['daily', 'weekly', 'monthly', 'custom']);

// draft custom recur, based on TickTick:
// unit_type = day, week, month
// unit_value = {every n} type

export const todoItems = pgTable(
  'todo_items',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    dueDate: timestamp('due_date'),
    status: statusEnum('status').default('not_started').notNull(),
    priority: priorityEnum('priority'),
    isAllDay: boolean('is_all_day').default(true).notNull(),
    meta: jsonb('meta').default({}).notNull(),
    recurType: recurEnum('recur_type'),
    recurCustom: jsonb('recur_custom').default({}).notNull(), // TODO: decide the details
    parentId: integer('parent_id').references((): AnyPgColumn => todoItems.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // TODO: convert to a partial unique index (.where(deletedAt IS NULL)) once soft delete is added,
    // so a soft-deleted child doesn't block generating a new one for the same parent.
    parentIdIdx: uniqueIndex('todo_items_parent_id_idx').on(table.parentId),
  }),
);

export const todoItemsRelations = relations(todoItems, ({ one }) => ({
  parent: one(todoItems, {
    fields: [todoItems.parentId],
    references: [todoItems.id],
    relationName: 'parentChild',
  }),
  child: one(todoItems, {
    relationName: 'parentChild',
  }),
}));

export type TodoItem = InferSelectModel<typeof todoItems>;
