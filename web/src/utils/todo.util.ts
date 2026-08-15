import { Circle, CircleDot, CircleCheck, Archive } from '@lucide/vue';
import type { CustomRecurrence } from '@/types/todo';

export const statusIcons: Record<string, unknown> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CircleCheck,
  archived: Archive,
};

export const statusColors: Record<string, string> = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  archived: 'text-gray-400',
};

const recurUnitNouns: Record<string, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function customRecurLabel(recurCustom: CustomRecurrence) {
  if (recurCustom.type === 'weekly') {
    const days = [...recurCustom.weekdays].sort((a, b) => a - b).map((day) => weekdayNames[day]);
    return `Repeat weekly on ${days.join(', ')}`;
  }

  const days = [...recurCustom.monthDays].sort((a, b) => a - b);
  return `Repeat monthly on day ${days.join(', ')}`;
}

export function recurLabel(
  recurType: string,
  recurValue: number,
  recurCustom?: CustomRecurrence | null,
) {
  if (recurType === 'custom') {
    return recurCustom ? customRecurLabel(recurCustom) : 'Repeat (custom)';
  }

  const unit = recurUnitNouns[recurType] ?? recurType;
  return `Repeat every ${recurValue} ${unit}${recurValue === 1 ? '' : 's'}`;
}
