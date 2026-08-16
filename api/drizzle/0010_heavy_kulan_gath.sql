CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "todo_items_name_trgm_idx" ON "todo_items" USING gin ("name" gin_trgm_ops) WHERE "todo_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "todo_items_description_trgm_idx" ON "todo_items" USING gin ("description" gin_trgm_ops) WHERE "todo_items"."deleted_at" is null;