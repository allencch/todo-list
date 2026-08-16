import { and, isNull, notInArray, gte, lt, desc, sql } from 'drizzle-orm';
import { todoItems } from '@/db/schema';
import { db } from '@/db/client';
import { env } from '@/config/env';

const SUMMARY_LIMIT = 10;
const LOOKAHEAD_DAYS = 7;

// Highest priority first, NULLS LAST puts "no priority" at the end; ties
// broken by newest id, matching the sort used elsewhere in the app.
async function fetchTopTodos() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfWindow = new Date(startOfToday);
  endOfWindow.setDate(endOfWindow.getDate() + LOOKAHEAD_DAYS);

  return db
    .select({
      id: todoItems.id,
      name: todoItems.name,
      description: todoItems.description,
      priority: todoItems.priority,
      status: todoItems.status,
      dueDate: todoItems.dueDate,
    })
    .from(todoItems)
    .where(
      and(
        isNull(todoItems.deletedAt),
        notInArray(todoItems.status, ['completed', 'archived']),
        gte(todoItems.dueDate, startOfToday),
        lt(todoItems.dueDate, endOfWindow)
      )
    )
    .orderBy(sql`${todoItems.priority} DESC NULLS LAST`, desc(todoItems.id))
    .limit(SUMMARY_LIMIT);
}

function formatTodoForPrompt(todo, index) {
  const dueDate = todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 10) : 'unknown';
  const description = todo.description?.trim() || '(no description)';

  return [
    `(id: ${todo.id}) "${todo.name}"`,
    `   priority: ${todo.priority ?? 'none'}`,
    `   status: ${todo.status}`,
    `   due: ${dueDate}`,
    `   description: ${description}`,
  ].join('\n');
}

function buildPrompt(todos) {
  return [
    'You are helping a user triage their tasks due between today and the next',
    `${LOOKAHEAD_DAYS} days, listed below from highest to lowest priority.`,
    '',
    "Read each task's name and description, and write a short, plain-language",
    "summary of what the tasks are actually about -- not just a restated",
    'priority ranking. Group or connect related tasks where it makes sense.',
    '',
    'This data may come from a test/seed dataset, so some task names or',
    "descriptions could be random words or gibberish with no real meaning.",
    "If a task's content doesn't make sense, say so plainly instead of",
    'inventing a plausible-sounding interpretation for it.',
    '',
    'Tasks:',
    todos.map(formatTodoForPrompt).join('\n'),
  ].join('\n');
}

async function callOllama(prompt) {
  const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.ollamaModel,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`);
  }

  const body = await response.json();
  return body.response;
}

async function aiSummarize(request, reply) {
  const todos = await fetchTopTodos();

  if (todos.length === 0) {
    reply.code(200);
    return { summary: 'No tasks due in the next 7 days.', todos: [] };
  }

  try {
    const summary = await callOllama(buildPrompt(todos));
    reply.code(200);
    return { summary, todos };
  } catch (err) {
    request.log.error(err);
    reply.code(502);
    return { error: 'Failed to reach the local AI model. Is Ollama running?' };
  }
}

async function aiRoutes(fastify, options) {
  fastify.get('/ai-summarize', aiSummarize);
}

export { aiRoutes };
