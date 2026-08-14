<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import type { TodoItem } from '@/types/todo';

const todos = ref<TodoItem[]>([]);

async function fetchTodos() {
  const response = await fetch('/api/todos');
  todos.value = await response.json();
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
</script>

<template>
  <div class="flex items-center gap-3 px-4">
    <div class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500">
      Filter shortcuts
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
</template>
