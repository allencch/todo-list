# Todo List

This is a simple Todo List web application.

## Development setup

Install [`asdf`](https://asdf-vm.com) (or [`mise`](https://mise.jdx.dev)). If you don't already have
the `nodejs` and `pnpm` asdf plugins added, add them first:

```bash
asdf plugin add nodejs
asdf plugin add pnpm
```

Then install the tool versions pinned in `.tool-versions`:

```bash
asdf install
```

This installs both Node.js and pnpm at the pinned versions.

Install dependencies (this is a pnpm workspace, run from the repo root):

```bash
pnpm install
```

Database: PostgreSQL, recommended version 16 and above. Create a database for the app -- the
`pg_trgm` extension is enabled automatically by the migrations, so no manual setup is needed there
(the database user does need privileges to create extensions).

Set up the environment variables in `api/.env` or `api/.env.local` (not the repo root). Both are
loaded; `.env.local` takes priority if a variable is set in both, so it's the place for
machine-specific values or secrets, while `.env` can hold shared defaults:

```
DATABASE_URL=<postgresql database url>
```

Run migrations (from the repo root):

```bash
pnpm run db:migrate
```

Start the development environment. This runs the API and the web app concurrently -- the API
defaults to port 3000, and the web dev server proxies `/api` requests to it:

```bash
pnpm dev
```


To test the large data, we can run

```bash
cd api && pnpm run db:seed:large
```

This will download text from Gutenberg and added to the database.
This is to test the scalability of the application.

## Docker

To use docker, run

```bash
docker compose up
```

Then run the migration with,

```bash
docker exec todo-list-api-1 node_modules/.bin/drizzle-kit migrate
```


## Stack

Backend
- NodeJS
- Fastify

Database
- PostgreSQL
- Drizzle

Frontend
- Vue
- Tailwind
- Vite


## Swagger

To allow `openapi.yaml` to be read from `swagger-ui` (Docker), run it with

```bash
ENABLE_CORS=1 pnpm dev:api
```

Then, we can view the document use this `http://localhost:3000/api/openapi.yaml` on the Swagger UI Explore.


## Decision logs

Refer [Decision Logs here](docs/decision-logs.md).

## Extra optional feature

Setup Ollama locally and pull a SLM (small language modal).
Tested on `granite4.1:3b`.
This allows AI summarize feature.


## Commands cheatsheet

Run test environment migration

```bash
# in api
pnpm drizzle-kit migrate --config=drizzle.test.config.ts
```
