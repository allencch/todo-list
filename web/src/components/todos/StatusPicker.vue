<script setup lang="ts">
import { humanize } from '@/utils/todo.util';

type Status = 'not_started' | 'in_progress' | 'completed' | 'archived';

const statuses: Status[] = ['not_started', 'in_progress', 'archived'];

defineProps<{
  modelValue: Status;
}>();

const emit = defineEmits<{
  'update:modelValue': [status: Status];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <button
      v-for="status in statuses"
      :key="status"
      type="button"
      class="cursor-pointer rounded-md border px-2 py-1 text-xs"
      :class="
        status === modelValue
          ? 'border-gray-400 bg-gray-100 font-medium text-gray-700'
          : 'border-gray-200 text-gray-500'
      "
      @click="emit('update:modelValue', status)"
    >
      {{ humanize(status) }}
    </button>
    <button
      type="button"
      class="ml-auto cursor-pointer rounded-md border px-2 py-1 text-xs"
      :class="
        modelValue === 'completed'
          ? 'border-green-400 bg-green-100 font-medium text-green-700'
          : 'border-green-300 text-green-600'
      "
      @click="emit('update:modelValue', modelValue === 'completed' ? 'not_started' : 'completed')"
    >
      Complete
    </button>
  </div>
</template>
