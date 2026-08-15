DROP INDEX "todo_items_parent_id_idx";--> statement-breakpoint
ALTER TABLE "todo_items" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE UNIQUE INDEX "todo_items_parent_id_idx" ON "todo_items" USING btree ("parent_id") WHERE "todo_items"."deleted_at" is null;