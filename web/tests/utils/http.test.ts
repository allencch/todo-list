import { describe, it, expect } from 'vitest';
import { safeParseJson, buildErrorMessage } from '@/utils/http';

describe('safeParseJson', () => {
  it('parses a valid JSON body', async () => {
    const response = new Response(JSON.stringify({ error: 'Todo not found' }));
    expect(await safeParseJson(response)).toEqual({ error: 'Todo not found' });
  });

  it('returns null for an empty body', async () => {
    const response = new Response('');
    expect(await safeParseJson(response)).toBeNull();
  });

  it('returns null for a non-JSON body', async () => {
    const response = new Response('not json');
    expect(await safeParseJson(response)).toBeNull();
  });
});

describe('buildErrorMessage', () => {
  it('returns the error string as-is', () => {
    expect(buildErrorMessage({ error: 'Todo not found' })).toBe('Todo not found');
  });

  it('joins field errors', () => {
    const body = {
      error: {
        fieldErrors: {
          name: ['Required'],
        },
      },
    };
    expect(buildErrorMessage(body)).toBe('name: Required');
  });

  it('joins multiple field errors', () => {
    const body = {
      error: {
        fieldErrors: {
          name: ['Required'],
          priority: ['Invalid option'],
        },
      },
    };
    expect(buildErrorMessage(body)).toBe('name: Required; priority: Invalid option');
  });

  it('falls back to a generic message when there is nothing to report', () => {
    expect(buildErrorMessage(null)).toBe('Something went wrong.');
    expect(buildErrorMessage({})).toBe('Something went wrong.');
  });
});
