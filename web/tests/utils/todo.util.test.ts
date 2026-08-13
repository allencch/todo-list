import { describe, it, expect } from 'vitest';
import { recurLabel } from '@/utils/todo.util';

describe('recurLabel', () => {
  it('labels a fixed-interval recurrence', () => {
    expect(recurLabel('daily', 1)).toBe('Repeat every 1 day');
    expect(recurLabel('weekly', 2)).toBe('Repeat every 2 weeks');
  });

  it('labels a custom weekly recurrence', () => {
    const label = recurLabel('custom', 1, { type: 'weekly', weekdays: [5, 1, 3] });
    expect(label).toBe('Repeat weekly on Mon, Wed, Fri');
  });

  it('labels a custom monthly recurrence', () => {
    const label = recurLabel('custom', 1, { type: 'monthly', monthDays: [15, 1] });
    expect(label).toBe('Repeat monthly on day 1, 15');
  });

  it('falls back to a generic label when custom recurrence has no recurCustom', () => {
    expect(recurLabel('custom', 1)).toBe('Repeat (custom)');
  });
});
