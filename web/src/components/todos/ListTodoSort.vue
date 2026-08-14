<script setup lang="ts">
import { ref } from 'vue';
import { ChevronUp, ChevronDown } from '@lucide/vue';

const emit = defineEmits<{
  change: [sort: Record<string, string>];
}>();

const SORT_FIELDS = [
  { value: 'createdAt', label: 'Created date'},
  { value: 'dueDate', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'name', label: 'Name' },
];

const sortBy = ref('');
const sortOrder = ref('asc');

function setSortBy(value: string) {
  if (sortBy.value === value) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = value;
    sortOrder.value = 'asc';
  }
  emit('change', { sortBy: sortBy.value, sortOrder: sortOrder.value });
}
</script>

<template>
  <div class="flex items-center gap-2 px-4">
    <button
      v-for="field in SORT_FIELDS"
      :key="field.value"
      type="button"
      class="flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        sortBy === field.value
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setSortBy(field.value)"
    >
      {{ field.label }}
      <ChevronUp v-if="sortBy === field.value && sortOrder === 'asc'" class="h-4 w-4" />
      <ChevronDown v-else-if="sortBy === field.value && sortOrder === 'desc'" class="h-4 w-4" />
    </button>
  </div>
</template>
