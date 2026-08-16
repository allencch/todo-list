CREATE INDEX "todo_items_status_id_idx" ON "todo_items" USING btree ("status","id") WHERE "todo_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "todo_items_priority_id_idx" ON "todo_items" USING btree ("priority","id") WHERE "todo_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "todo_items_due_date_id_idx" ON "todo_items" USING btree ("due_date","id") WHERE "todo_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "todo_items_name_id_idx" ON "todo_items" USING btree ("name","id") WHERE "todo_items"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "todo_items_created_at_id_idx" ON "todo_items" USING btree ("created_at","id") WHERE "todo_items"."deleted_at" is null;