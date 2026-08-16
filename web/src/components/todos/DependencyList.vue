<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { statusIcons, statusColors } from '@/utils/todo.util';

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

const route = useRoute();
const router = useRouter();

function openEdit(dependencyId: number) {
  const { new: _new, ...rest } = route.query;
  router.push({ query: { ...rest, edit: String(dependencyId) } });
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <span
      v-for="dependency in dependencies"
      :key="dependency.id"
      class="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm"
    >
      <button
        type="button"
        :aria-label="`Edit ${dependency.name}`"
        class="cursor-pointer"
        @click="openEdit(dependency.id)"
      >
        <component
          :is="statusIcons[dependency.status]"
          class="h-4 w-4 shrink-0"
          :class="statusColors[dependency.status]"
        />
      </button>
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
