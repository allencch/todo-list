CREATE TABLE "todo_item_dependencies" (
	"todo_item_id" integer NOT NULL,
	"dependency_id" integer NOT NULL,
	CONSTRAINT "todo_item_dependencies_todo_item_id_dependency_id_pk" PRIMARY KEY("todo_item_id","dependency_id")
);
--> statement-breakpoint
ALTER TABLE "todo_items" ADD COLUMN "dependent_id" integer;--> statement-breakpoint
ALTER TABLE "todo_item_dependencies" ADD CONSTRAINT "todo_item_dependencies_todo_item_id_todo_items_id_fk" FOREIGN KEY ("todo_item_id") REFERENCES "public"."todo_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_item_dependencies" ADD CONSTRAINT "todo_item_dependencies_dependency_id_todo_items_id_fk" FOREIGN KEY ("dependency_id") REFERENCES "public"."todo_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_items" ADD CONSTRAINT "todo_items_dependent_id_todo_items_id_fk" FOREIGN KEY ("dependent_id") REFERENCES "public"."todo_items"("id") ON DELETE set null ON UPDATE no action;