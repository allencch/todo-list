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
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel, isNull } from 'drizzle-orm';

export const statusEnum = pgEnum('status', ['not_started', 'in_progress', 'completed', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const recurEnum = pgEnum('recur', ['daily', 'weekly', 'monthly', 'yearly', 'custom']);

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
    recurValue: integer('recur_value'),
    recurCustom: jsonb('recur_custom').default({}).notNull(), // TODO: decide the details
    parentId: integer('parent_id').references((): AnyPgColumn => todoItems.id, {
      onDelete: 'set null',
    }),
    dependentId: integer('dependent_id').references((): AnyPgColumn => todoItems.id, {
      onDelete: 'set null',
    }),
    deletedAt: timestamp('deleted_at'),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Partial: excludes soft-deleted rows, so a soft-deleted child doesn't block
    // generating a new one for the same parent.
    parentIdIdx: uniqueIndex('todo_items_parent_id_idx')
      .on(table.parentId)
      .where(isNull(table.deletedAt)),
  }),
);


// Dependencies relationship:
// Todo A can only be completed, only if todo B is completed.
// Thus, todo A is the dependent, todo B is the dependencies
// Use join-table for many-to-many relationship

export const todoItemDependencies = pgTable(
  'todo_item_dependencies',
  {
    todoItemId: integer('todo_item_id')
      .notNull()
      .references(() => todoItems.id, { onDelete: 'cascade' }),
    dependencyId: integer('dependency_id')
      .notNull()
      .references(() => todoItems.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.todoItemId, table.dependencyId],
    }),
  ],
)

export const todoItemsRelations = relations(todoItems, ({ one, many }) => ({
  parent: one(todoItems, {
    fields: [todoItems.parentId],
    references: [todoItems.id],
    relationName: 'parentChild',
  }),
  child: one(todoItems, {
    relationName: 'parentChild',
  }),

  // many-to-many relationship here
  dependencyLinks: many(todoItemDependencies, { relationName: 'todoItemDependencyLinks' }),
  dependentLinks: many(todoItemDependencies, { relationName: 'dependencyTodoItemLinks' }),
}));

// This is one-to-one relationship
export const todoItemDependenciesRelations = relations(
  todoItemDependencies,
  ({ one }) => ({
    todoItem: one(todoItems, {
      fields: [todoItemDependencies.todoItemId],
      references: [todoItems.id],
      relationName: 'todoItemDependencyLinks',
    }),
    dependency: one(todoItems, {
      fields: [todoItemDependencies.dependencyId],
      references: [todoItems.id],
      relationName: 'dependencyTodoItemLinks',
    }),
  }),
);

export type TodoItem = InferSelectModel<typeof todoItems>;
