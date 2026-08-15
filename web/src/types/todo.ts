export type CustomRecurrence =
  | { type: 'weekly'; weekdays: number[] }
  | { type: 'monthly'; monthDays: number[] };

export interface TodoItem {
  id: number;
  name: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  priority?: string | null;
  recurType?: string | null;
  recurValue?: number | null;
  recurCustom?: CustomRecurrence | null;
  nextDueDate?: string | null;
  dependencies?: { id: number; name: string }[];
}
