<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ChevronDown } from '@lucide/vue';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import type { TodoItem } from '@/types/todo';

const todos = ref<TodoItem[]>([]);
const filterState = ref<Record<string, string>>({ status: '' });
const error = ref('');
const showPriorityFilter = ref(false);

function sanitizeQueryParams() {
  const cleanedParams = Object.fromEntries(
    Object.entries(filterState.value).filter(([key, value]) => value !== '')
  );
  return cleanedParams;
}

async function fetchTodos() {
  try {
    const params = new URLSearchParams(sanitizeQueryParams());
    const response = await fetch(`/api/todos?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to load todos (${response.status})`);
    }
    todos.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load todos';
  }
}

onMounted(fetchTodos);

function handleUpdate(todo: TodoItem) {
  const index = todos.value.findIndex((item) => item.id === todo.id);
  if (index !== -1) {
    todos.value[index] = todo;
  }
}

function handleDelete(todo: TodoItem) {
  const index = todos.value.findIndex((item) => item.id === todo.id);
  if (index !== -1) {
    todos.value.splice(index, 1);
  }
}

function setFilterStatus(status: string) {
  filterState.value.status = status;
  fetchTodos();
}

function setFilterPriority(priority: string) {
  filterState.value.priority = priority;
  fetchTodos();
}
</script>

<template>
  <div class="flex items-center gap-3 px-4">
    <div class="flex flex-1 items-center gap-2 overflow-x-auto">
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          filterState.status === ''
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setFilterStatus('')"
      >
        All
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          filterState.status === 'not_started'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setFilterStatus('not_started')"
      >
        Not started
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          filterState.status === 'in_progress'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setFilterStatus('in_progress')"
      >
        In progress
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          filterState.status === 'archived'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setFilterStatus('archived')"
      >
        Archived
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          filterState.status === 'completed'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setFilterStatus('completed')"
      >
        Completed
      </button>
      <button
        type="button"
        class="flex items-center gap-1 px-2 py-1.5 text-sm whitespace-nowrap text-gray-500 hover:text-gray-900"
        @click="showPriorityFilter = !showPriorityFilter"
      >
        More filters
        <ChevronDown class="h-4 w-4 transition-transform" :class="showPriorityFilter ? 'rotate-180' : ''" />
      </button>
    </div>
    <AddItem @submit="todos.push($event)" />
  </div>

  <div v-if="showPriorityFilter" class="flex items-center gap-2 px-4">
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        filterState.priority === ''
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setFilterPriority('')"
    >
      No priority
    </button>
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        filterState.priority === 'low'
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setFilterPriority('low')"
    >
      Low
    </button>
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        filterState.priority === 'medium'
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setFilterPriority('medium')"
    >
      Medium
    </button>
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        filterState.priority === 'high'
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setFilterPriority('high')"
    >
      High
    </button>
  </div>

  <main class="flex-1 overflow-y-auto px-4 py-4">
    <ul class="divide-y divide-gray-200 rounded-md border border-gray-300">
      <Item
        :todo="todo"
        v-for="todo in todos"
        :key="todo.id"
        @submit="handleUpdate"
        @delete="handleDelete"
        @complete="fetchTodos"
      />
    </ul>
  </main>

  <ErrorModal v-if="error" :message="error" @close="error = ''" />
</template>
