ALTER TABLE "todo_items" ADD COLUMN "is_all_day" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "todo_items" ADD COLUMN "meta" jsonb DEFAULT '{}'::jsonb NOT NULL;