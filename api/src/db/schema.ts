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
} from 'drizzle-orm/pg-core';
import { relations, InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const statusEnum = pgEnum('status', ['not_started', 'in_progress', 'completed', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

export const todoItems = pgTable('todo_items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  dueDate: timestamp(null),
  status: statusEnum('status').default('not_started').notNull(),
  priority: priorityEnum('priority'),
  isAllDay: boolean('is_all_day').default(true).notNull(),
  meta: jsonb('meta').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
});
