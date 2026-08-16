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
  index,
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

    // One composite (column, id) index per sortBy option exposed in listTodos.
    // The trailing `id` matches the keyset-pagination tiebreak (buildCursorCondition),
    // so each index serves both the equality/range filter and the cursor'd sort.
    // Partial: excludes soft-deleted rows, since every listTodos query filters those out.
    statusIdIdx: index('todo_items_status_id_idx')
      .on(table.status, table.id)
      .where(isNull(table.deletedAt)),
    priorityIdIdx: index('todo_items_priority_id_idx')
      .on(table.priority, table.id)
      .where(isNull(table.deletedAt)),
    dueDateIdIdx: index('todo_items_due_date_id_idx')
      .on(table.dueDate, table.id)
      .where(isNull(table.deletedAt)),
    nameIdIdx: index('todo_items_name_id_idx')
      .on(table.name, table.id)
      .where(isNull(table.deletedAt)),
    createdAtIdIdx: index('todo_items_created_at_id_idx')
      .on(table.createdAt, table.id)
      .where(isNull(table.deletedAt)),

    // Trigram GIN indexes so the `content` filter's ILIKE '%...%' substring search
    // (listTodos) can use an index instead of a sequential scan. Requires the
    // pg_trgm extension -- see the migration.
    nameTrgmIdx: index('todo_items_name_trgm_idx')
      .using('gin', table.name.op('gin_trgm_ops'))
      .where(isNull(table.deletedAt)),
    descriptionTrgmIdx: index('todo_items_description_trgm_idx')
      .using('gin', table.description.op('gin_trgm_ops'))
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
