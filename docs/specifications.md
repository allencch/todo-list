# Features

- [ ] Build a todo list application with both a backend API and a simple web UI.

## Todo management

- unique id
- name
- description
- due date (with time)
- status: not started, in progress, completed, archived
- priority: low, medium, high. allow null
- CRUD
- Recurring tasks
  + schedule: daily, weekly, monthly, custom

- [ ] When a recurring TODO is marked as completed, the next occurrence should be created automatically based on its schedule.


## Task dependencies

- A TODO can depend on one or more other TODOs.
- A dependent task cannot be moved to "In Progress" until all of its dependencies are "Completed."


## Filtering and sorting

This is frontend and API related, not database related.

Filter by: status, priority, due date, dependency status (blocked / unblocked)
Sort by: due date, priority, status, name
