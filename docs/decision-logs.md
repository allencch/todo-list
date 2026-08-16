# Decision logs

## Preface

This is project is a Todo List web application.
However, it contains some specifications that is more than a usual todo list application.
For example, it has the dependencies blocking functionality.
A todo cannot be changed to `In Progress`, if the dependencies are not completed.
Furthermore, the status of `Archived`, it is mutually exclusive with other statuses (Not Started, In Progress, Completed). Therefore, this Todo List web application has the Kanban characteristics, which we can use it to track various tasks.

For this project, TypeScript is chosen because of its static typing, which allows to catch the errors during compilation.
Besides that, TypeScript can be used in both backend and frontend.

NodeJS with Fastify is chosen because of the speed performance.

Vue is chosen as it has a very mature ecosystem with lightweight footprint.

Tailwind CSS, as a modern CSS framework, it reduces the work of editing styles, overriding styles, and creating BEM naming. This makes the development focus on the UI design instead of editing the CSS.

On the database, PostgreSQL is used, because it allows various extensions such as vector embedding storage, which is useful for RAG in LLM implementation.
Drizzle ORM is chosen as (i) it is lightweight and (ii) it uses syntax based onSQL. Therefore, it supports the usage of CTE as well.


## Ambiguity and decision

Firstly, the status of the Archived is not commonly found in various todo apps such as Google Task, Microsoft To Do, and TickTick.
In Emacs org-mode, once a task is `Done`, then we can archive it.
Therefore, Archived state is not mutually exclusive in this sense.
In my opinion, the application that resembles this characteristic is Kanban board. We completed the task, then move to archived, and the status changed to `Archived`, example Trello.

In this Todo List application, I decided to use same database field, namely `status` for the Archived, because this fulfils the current specifications.
Furthermore, adding an new column for archived status doesn't require a lot of effort.

Secondly, the task dependencies. A todo will be blocked if the dependencies are not completed. When it is blocked, it cannot be changed from `Not Started` to `In Progress`.
I was thinking to use state machine, however, I think it is over-engineered and there are some ambiguities, such as whether a blocked todo can change the state from `Not Started` to `Completed` or even `Archived`?
At the end, I decided not to use state machine, and allows the todo item to change the state from `Not Started` to `Completed` or `Archived`, even the dependencies are not completed.
This is because of practical scenario.
Assuming a task is "Build the frontend", the dependencies are: "Design the UI" and "Build the API".
In reality, the frontend app has to be built with after backend API supports essential functionality, and the design is already decided, else frontend cannot be started.
However, for whatever reasons, API and design do not have final outcome, and the frontend engineer to move forward to build the frontend first, without the depending on the final design and API, and completed the task "Build the frontend". And he mark the tasks as completed, and add two separate tasks "API integration" and "UI improve". This is sometimes happen in the team.
As a result, I decided not to block the status to change to `Completed`, even the dependencies are not completed.
Besides that, if this specification needs to be changed, there is only a little effort to be done.

Next is the dependencies relationship. In this application, I decided to adopt many-to-many relationship, meaning a todo can have many dependencies, a todo can also have many dependents. 
For example, the task "Subscribe OpenAI API", this task may block several other tasks such as "Build the agent", "Build the automation pipeline". To design many-to-many in the current stage will be more benefit. This is because if the relationship is done in one-to-many, there will be more effort to migrate the data to the join table.

Though the requirement stated "A simple, functional web interface for managing TODOs" and "functional and usable is sufficient", I still take serious on the UX.
In my opinion, Todo List application is UX-focus application. A nice todo list application depends on the UX, not just the API and functionality.
And the core functions (listing, CRUD, searching, filtering, sorting) are very common in other applications such as blogging, user management, event management, etc.
Therefore, to make the todo list application be useful, the UX plays an important role.
As a result, the features such as responsiveness (mobile friendly), toast notification, URL path to edit the item, and filtering and sorting shortcut buttons are imporant. The current UX is not perfect and may not satisfy everyone's need, but I tried my best to make it easy to use.

> The API should support multiple users accessing the same TODO list concurrently.

As the application doesn't support multiple user accounts (I decided not to build, see the reasons below), the above requirement can still be achived by multiple machine connected to this web application, or even with multiple browsers, windows, or tabs.
Therefore, the optimistic lock is chosen, as we don't want the "lost update" issue to happen.


## Not building

With the time constraint, some of the extra features (nice-to-have features) I decided not to do.

User authentication and registration. This is a common feature for any web application. However, in my opinion, this is not valuable for this application. Because this will require more time to build the user management features (sign up, login, logout, access token, refresh token, forgot password, reset password, etc).
If it is to build with OAuth, then it requires to setup the OAuth App.
If to build passwordless sign up, this will require email server to be setup as well.
Building the signup page and login page, these do not contribute to the todo list features.

However, if the time is sufficient, user management is worth to build, with teh feature to of collaborative management on the todo list.
And, by changing the interface, this todo list application can be used as a Kanban board as well.


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
