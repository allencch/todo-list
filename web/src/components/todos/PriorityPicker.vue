<script setup lang="ts">
import { priorityColors, humanize } from '@/utils/todo.util.ts';

type Priority = 'low' | 'medium' | 'high';

const priorities: (Priority | null)[] = [null, 'low', 'medium', 'high'];

defineProps<{
  modelValue: Priority | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [priority: Priority | null];
}>();
</script>

<template>
  <div class="inline-flex flex-wrap gap-1">
    <button
      v-for="priority in priorities"
      :key="priority ?? 'none'"
      type="button"
      class="cursor-pointer rounded-md border px-2 py-1 text-xs"
      :class="
        priority === modelValue
          ? priority
            ? `border-current bg-gray-100 font-medium ${priorityColors[priority]}`
            : 'border-gray-400 bg-gray-100 font-medium text-gray-700'
          : 'border-gray-200 text-gray-500'
      "
      @click="emit('update:modelValue', priority)"
    >
      {{ priority ? humanize(priority) : 'None' }}
    </button>
  </div>
</template>
