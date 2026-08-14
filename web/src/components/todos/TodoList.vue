<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import type { TodoItem } from '@/types/todo';

const todos = ref<TodoItem[]>([]);
const filterState = ref<Record<string, string>>({ status: '' });
const error = ref('');

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
    </div>
    <AddItem @submit="todos.push($event)" />
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
