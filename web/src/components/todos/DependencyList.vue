<script setup lang="ts">
import { Circle, CircleDot, CircleCheck, Archive } from '@lucide/vue';

type DependencyOption = { id: number; name: string; status: string };

withDefaults(
  defineProps<{
    dependencies: DependencyOption[];
    readonly?: boolean;
  }>(),
  { readonly: false },
);

const emit = defineEmits<{
  remove: [dependencyId: number];
}>();

const statusIcons: Record<string, unknown> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CircleCheck,
  archived: Archive,
};

const statusColors: Record<string, string> = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  archived: 'text-gray-400',
};
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="dependency in dependencies"
      :key="dependency.id"
      class="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm"
    >
      <component
        :is="statusIcons[dependency.status]"
        class="h-4 w-4 shrink-0"
        :class="statusColors[dependency.status]"
      />
      {{ dependency.name }}
      <button
        v-if="!readonly"
        type="button"
        class="text-gray-400 hover:text-gray-700"
        @click="emit('remove', dependency.id)"
      >
        x
      </button>
    </span>
  </div>
</template>
