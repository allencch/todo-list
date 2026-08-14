<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import ListTodoFilters from '@/components/todos/ListTodoFilters.vue';
import ListTodoSort from '@/components/todos/ListTodoSort.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import type { TodoItem } from '@/types/todo';

const props = defineProps<{ search?: string }>();

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

function handleFilterChange(filter: Record<string, string>) {
  Object.assign(filterState.value, filter);
  fetchTodos();
}

function handleAddItem() {
  fetchTodos();
}

watch(
  () => props.search,
  (search) => {
    filterState.value.content = search ?? '';
    fetchTodos();
  }
);
</script>

<template>
  <ListTodoFilters @change="handleFilterChange">
    <AddItem @submit="handleAddItem" />
  </ListTodoFilters>

  <ListTodoSort @change="handleFilterChange" />

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
