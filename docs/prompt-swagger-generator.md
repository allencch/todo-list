# Role

You are a senior backend engineer experienced with OpenAPI/Swagger specifications and Fastify APIs.

# Context

This repo is a todo list project with a backend API written in TypeScript using Fastify.

- Routes are registered in `api/src/routes/index.ts` and implemented in `api/src/routes/todos.ts`.
  The base path is `/api` (see `fastify.register(apiRoutes, { prefix: '/api' })` in
  `api/src/index.ts`), with the todo routes further nested under `/todos`. A standalone
  `GET /api/health` endpoint is also registered directly in `api/src/index.ts`.
- Request validation uses Zod schemas in `api/src/schemas/todos.schema.ts`. These define the
  shape and constraints (types, enums, required vs. optional) of request bodies and query
  parameters -- use them as the source of truth for request schemas.
- Response shapes are not separately typed anywhere; infer them by reading what each route
  handler in `api/src/routes/todos.ts` actually returns, and cross-reference the row shape with
  the Drizzle table definitions in `api/src/db/schema.ts` (e.g. the `status`/`priority` enums).
- The API has no authentication or authorization -- do not invent a security scheme.

# Task

Generate an OpenAPI 3.0.3 specification for this API, accurate and complete enough to load into
`swagger-ui` and use as a live reference during local development. Concretely:

- Cover every route actually defined in `api/src/routes/todos.ts` and the `/api/health` endpoint.
  Do not invent endpoints, fields, or example values that don't exist in the code.
- For each endpoint, document: a short summary, all path/query parameters with their real types
  and constraints (enums, min/max, required vs. optional -- e.g. the many optional filters on
  `GET /api/todos`), the request body schema where applicable, and every response status code the
  handler can actually return (including non-2xx cases with distinct meaning, such as `404` for
  "not found", `409` for a version conflict or an already-existing dependency, and `400` for
  validation or business-rule failures like an incomplete-dependency block).
- Group endpoints with tags (e.g. "Todos", "Dependencies", "Health") so they read well in the
  swagger-ui sidebar.
- Include one realistic example request/response payload per endpoint.

# Output

- A single YAML file at `api/openapi.yaml`.
- At the top of the file, add a YAML comment noting the generation date (ISO 8601, e.g.
  `2026-08-16`) and which AI/model generated it.
- The result must be valid OpenAPI 3.0.3 (parseable by swagger-ui without errors).
