# Decision logs

Decision logs and other general logs in reverse order.

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
