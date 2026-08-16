import { db } from '@/db/client';
import { todoItems } from '@/db/schema';

const WORD_SOURCE_URL = 'https://www.gutenberg.org/files/1342/1342-0.txt';
const TARGET_COUNT = 15000;
const BATCH_SIZE = 1000;

const STATUSES = [
  'not_started',
  'not_started',
  'not_started',
  'in_progress',
  'completed',
  'archived',
] as const;
const PRIORITIES = [null, null, 'low', 'medium', 'high'] as const;

function randomPick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDueDate(): Date | null {
  if (Math.random() < 0.4) return null;
  const daysOffset = Math.floor(Math.random() * 120) - 30;
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function fetchWords(): Promise<string[]> {
  const response = await fetch(WORD_SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch word source (${response.status})`);
  }
  const text = await response.text();

  const startMarker = text.indexOf('*** START OF');
  const endMarker = text.indexOf('*** END OF');
  const body = startMarker !== -1 && endMarker !== -1 ? text.slice(startMarker, endMarker) : text;

  return body
    .split(/[^a-zA-Z']+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

async function seed() {
  const seedStartedAt = new Date();

  console.log(`Fetching word source from ${WORD_SOURCE_URL}...`);
  const words = await fetchWords();
  console.log(`Got ${words.length} candidate words.`);

  if (words.length < TARGET_COUNT) {
    throw new Error(
      `Only found ${words.length} words, need ${TARGET_COUNT}. Pick a longer source text.`
    );
  }

  const picked = shuffle(words).slice(0, TARGET_COUNT);
  const rows = picked.map((word) => ({
    name: word,
    status: randomPick(STATUSES),
    priority: randomPick(PRIORITIES),
    dueDate: randomDueDate(),
  }));

  console.log(`Inserting ${rows.length} todos in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(todoItems).values(batch);
    console.log(`  inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log('Done.');
  console.log(
    `To remove seeded data later: DELETE FROM todo_items WHERE created_at >= '${seedStartedAt.toISOString()}';`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
