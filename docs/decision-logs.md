# Decision logs

## Preface

This project is a Todo List web application. However, it contains some
specifications that go beyond a typical todo list application. For
example, it includes task dependency blocking functionality. A todo
item cannot be changed to `In Progress` if its dependencies are not
completed. Furthermore, the `Archived` status is mutually exclusive
with other statuses (Not Started, In Progress, Completed). Therefore,
this Todo List web application exhibits Kanban characteristics,
allowing it to be used to track various tasks efficiently.

For this project, TypeScript was chosen for its static typing, which
allows catching errors during compilation. Besides that, TypeScript
can be used for both the backend and frontend.

NodeJS with Fastify was chosen for its fast performance.

Vue was chosen because it has a mature ecosystem alongside a
lightweight footprint.

Tailwind CSS, as a modern CSS framework, reduces the overhead of
editing styles, overriding styles, and creating BEM class names. This
allows development to focus on UI design instead of custom CSS
writing.

On the database side, PostgreSQL is used because it supports various
extensions, such as vector embedding storage, which is useful for RAG
implementations in LLM projects. Drizzle ORM was chosen because (i) it
is lightweight and (ii) it uses an SQL-like syntax, thereby supporting
features such as CTEs seamlessly.

## Ambiguity and decision

Firstly, the `Archived` status is not commonly found in typical todo
apps like Google Tasks, Microsoft To Do, or TickTick. In Emacs
org-mode, once a task is set to `Done`, we can archive it. Therefore,
the Archived state is not mutually exclusive in that context. In my
opinion, the pattern that best matches this characteristic is the
Kanban board (e.g., Trello), where we complete a task, move it to
archived, and its status changes to `Archived`.

In this Todo List application, I decided to use the same database
field, namely `status`, for `Archived`, as this satisfies the current
specifications. Furthermore, adding a dedicated column for archived
status in the future requires minimal effort.

Secondly, regarding task dependencies: a todo item is blocked if its
dependencies are not completed. When blocked, its status cannot be
changed from `Not Started` to `In Progress`. I considered using a
state machine; however, I felt it would be over-engineered and
introduce ambiguities--such as whether a blocked todo can transition
from `Not Started` directly to `Completed` or `Archived`. In the end,
I decided against a state machine and permitted todo items to
transition from `Not Started` directly to `Completed` or `Archived`,
even if their dependencies are incomplete. This decision aligns with
practical scenarios. For example, consider a task "Build the frontend"
with dependencies "Design the UI" and "Build the API". In theory, the
frontend should only be built after the backend API supports essential
functionality and the design is finalized. In reality, even if the API
and design are not fully finished, a frontend engineer might proceed
to build the frontend without waiting for final designs/APIs to
complete their sprint goals. They mark "Build the frontend" as
completed and create two follow-up tasks: "API integration" and "UI
refinement". This scenario frequently happens in real engineering
teams. As a result, I decided not to block state transitions to
`Completed`, even when dependencies remain incomplete. Furthermore,
should this business logic need to change, adjusting it requires
minimal effort.

Next is the dependency relationship design. In this application, I
opted for a many-to-many relationship, meaning a todo can have
multiple dependencies, and can also have multiple dependents. For
example, the task "Subscribe to OpenAI API" may block several
downstream tasks like "Build the agent" and "Build the automation
pipeline". Implementing a many-to-many schema at this stage is more
beneficial than a one-to-many approach, as it avoids complex data
migrations to join tables later.

Although the requirement stated "A simple, functional web interface
for managing TODOs" and "functional and usable is sufficient", I still
took the UX seriously. In my opinion, a Todo List application is
inherently a UX-focused product. What sets a great todo list apart is
the user experience, not just the API design or basic feature
set. Since core operations (listing, CRUD, searching, filtering,
sorting) are common across applications like blogs, user management
systems, and event planners, UX plays a crucial role in making a todo
app truly useful. Consequently, features like mobile responsiveness,
toast notifications, URL routes for item editing, and
filtering/sorting shortcuts were prioritized. While the current UX may
not be perfect, I strove to make it as intuitive as possible.

> The API should support multiple users accessing the same TODO list
> concurrently.

Since the application does not currently support multiple user
accounts (see reasons below), the above requirement is met by
supporting access from multiple machines, browsers, windows, or
tabs. Optimistic locking was chosen to prevent lost update issues
during concurrent access.


## Not building

Due to time constraints, I decided to omit certain non-essential
(nice-to-have) features:

User authentication and registration. While standard across web
applications, this added little core value relative to the time
required to build full user management (sign up, login, logout,
access/refresh tokens, password recovery, etc.). Implementing OAuth
would require registering third-party applications, while passwordless
authentication would require setting up an SMTP server. Building
signup and login pages does not contribute directly to evaluating todo
management capabilities.

However, given sufficient time, user management would be a worthwhile
addition to enable multi-user collaborative todo list
management. Furthermore, with a few frontend layout adjustments, this
application could easily be adapted to present a full Kanban board
interface.


---

Decision logs and other general logs in reverse order.


## 2026-08-16

### Lock

> The API should support multiple users accessing the same TODO list concurrently.

To prevent user to overwrite the others, and this is about race condition.
For the current stage, optimistic lock is the best solution I think for the current stage.
If allows sync and conflicting detection, this will be much more complex.

### Large scale search

For large scale search, choosing `pg_trgm` over FTS now. The `ilike` is slow, FTS on the other hand will need to match at word boundaries.

For frontend wise, use `vue-virtual`, so that only visibile items are loaded in the DOM.



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
