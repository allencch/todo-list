<script setup lang="ts">
import { statusIcons, statusColors } from '@/utils/todo.util.ts';

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
