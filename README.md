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

Set up the environment variables in `api/.env.local` (not the repo root, and not a plain `.env` --
only `.env.local` is loaded):

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


## Commands cheatsheet

Run test environment migration

```bash
# in api
pnpm drizzle-kit migrate --config=drizzle.test.config.ts
```
