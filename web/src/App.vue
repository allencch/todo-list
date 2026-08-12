<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Item from '@/components/todos/Item.vue';
import type { TodoItem } from '@/types/todo';

const todos = ref<TodoItem[]>([]);

onMounted(async () => {
  const response = await fetch('/api/todos');
  todos.value = await response.json();
});
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-2xl flex-col border-x border-gray-200">
    <header class="flex items-center gap-3 p-4">
      <input
        type="text"
        placeholder="Search"
        class="flex-1 rounded-md border border-gray-300 px-3 py-2"
      />
      <button class="rounded-md border border-gray-300 px-3 py-2">Search</button>
      <button class="h-10 w-10 rounded-full border border-gray-300"></button>
    </header>

    <div class="px-4">
      <div class="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-500">
        Filter shortcuts
      </div>
    </div>

    <main class="flex-1 overflow-y-auto px-4 py-4">
      <ul class="divide-y divide-gray-200 rounded-md border border-gray-300">
        <Item :todo="todo" v-for="todo in todos" :key="todo.id" />
      </ul>
    </main>
  </div>
</template>
