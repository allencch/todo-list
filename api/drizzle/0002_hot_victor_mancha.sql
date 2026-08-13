CREATE TYPE "public"."recur" AS ENUM('daily', 'weekly', 'monthly', 'custom');--> statement-breakpoint
ALTER TABLE "todo_items" ADD COLUMN "recur_type" "recur";--> statement-breakpoint
ALTER TABLE "todo_items" ADD COLUMN "recur_custom" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "todo_items" ADD COLUMN "parent_id" integer;--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_parent_id_todo_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."todo_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "todo_items_parent_id_idx" ON "todo_items" USING btree ("parent_id");