<script setup lang="ts">
import { ref, watch } from 'vue';
import DependencyList from './DependencyList.vue';

type DependencyOption = { id: number; name: string; status: string };

const props = defineProps<{
  excludeId: number;
  dependencies: DependencyOption[];
}>();

const emit = defineEmits<{
  select: [dependency: DependencyOption];
  remove: [dependencyId: number];
}>();

const query = ref('');
const results = ref<DependencyOption[]>([]);
const showResults = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | undefined;

async function search() {
  if (!query.value.trim()) {
    results.value = [];
    return;
  }

  const params = new URLSearchParams({
    content: query.value,
    limit: '8',
    excludeId: String(props.excludeId),
  });
  const response = await fetch(`/api/todos?${params}`);
  results.value = response.ok ? await response.json() : [];
}

watch(query, () => {
  clearTimeout(searchTimeout);
  showResults.value = true;
  searchTimeout = setTimeout(search, 300);
});

function selectResult(result: DependencyOption) {
  emit('select', result);
  query.value = '';
  results.value = [];
  showResults.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
    <h3 class="text-sm font-medium text-gray-700">Dependencies</h3>

    <div class="relative">
      <input
        v-model="query"
        type="text"
        placeholder="Search todos to depend on"
        class="w-full rounded-md border border-gray-300 px-3 py-2"
        @focus="showResults = true"
      />
      <ul
        v-if="showResults && results.length > 0"
        class="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-md"
      >
        <li
          v-for="result in results"
          :key="result.id"
          class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
          @click="selectResult(result)"
        >
          {{ result.name }}
        </li>
      </ul>
    </div>

    <DependencyList :dependencies="dependencies" @remove="emit('remove', $event)" />
  </div>
</template>
