# Decision logs

Decision logs and other general logs in reverse order.

## 2026-08-15

Pagination. Choosing cursor-based pagination, instead of offset-based.
This is because, the "system should handle a TODO list with 10,000+ items".
Cursor-based pagination is best for this time of rendering.

Status changes specification.
Dependencies only block changes to `in_progress`, but not block others like `completed`.
This is the design decision, as if the task is already completed,
then just let it be completed by bypassing the check of the dependencies.


## 2026-08-14

### About status

Status `archived` should be a different column, instead of same column with `not_started`, `in_progress`, and `completed`.
Becaused completed task can be archived later.
But, just do as the status for now.

### About dependencies

As the requirement says

> A TODO can depend on one or more other TODOs.

This looks like one-to-many relationship.
But I decide to do many-to-many relationship, which will be more practical later.


## 2026-08-12

Initial stack.
Backend:
- NodeJS - Common widely used
- Fastify - Faster than ExpressJS

Database:
- PostgreSQL - Supports various extension, especially pgvector
- Drizzle - Lightweight ORM

Frontend:
- Vue - Common, popular
- Tailwind - Modern choice
- Vite - Modern choice
