import { describe, expect, it } from 'vitest';

import { db } from '../../src/db/client';

describe('database', () => {
  it('can connect to the database', async () => {
    const result = await db.execute('SELECT 1');

    expect(result).toBeDefined();
  });
});
