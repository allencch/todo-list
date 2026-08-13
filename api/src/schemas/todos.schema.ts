import { z } from 'zod';
import { CustomRecurrence } from '@/modules/todo.types.ts';

export const customRecurrenceSchema: z.ZodType<CustomRecurrence> = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('weekly'),
    weekdays: z.array(z.number().int().min(0).max(6)),
  }),
  z.object({
    type: z.literal('monthly'),
    monthDays: z.array(z.number().int().min(1)),
  }),
]);

function requiresRecurCustomWhenCustom(data: {
  recurType?: string | null;
  recurCustom?: CustomRecurrence;
}) {
  return data.recurType !== 'custom' || data.recurCustom != null;
}

export const baseTodoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  recurType: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']).nullable().optional(),
  recurValue: z.coerce.number().int().positive().nullable().optional(),
  recurCustom: customRecurrenceSchema.optional(),
});

export const createTodoSchema = baseTodoSchema.refine(requiresRecurCustomWhenCustom, {
  message: 'recurCustom is required when recurType is custom',
  path: ['recurCustom'],
});

export const updateTodoSchema = baseTodoSchema
  .partial()
  .extend({
    status: z.enum(['not_started', 'in_progress', 'archived']).optional(),
    priority: z.enum(['low', 'medium', 'high']).nullable().optional(),
  })
  .refine(requiresRecurCustomWhenCustom, {
    message: 'recurCustom is required when recurType is custom',
    path: ['recurCustom'],
  });
