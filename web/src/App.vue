<script setup lang="ts">
import TodoList from '@/components/todos/TodoList.vue';
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

    <TodoList />
  </div>
</template>
