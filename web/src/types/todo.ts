export interface TodoItem {
  id: number;
  name: string;
  description?: string | null;
  dueDate?: string | null;
  status: string;
  priority?: string | null;
}
