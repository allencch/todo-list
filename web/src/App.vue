<script setup lang="ts">
import { ref } from 'vue';
import TodoList from '@/components/todos/TodoList.vue';

const searchInput = ref('');
const search = ref('');

function handleSearch() {
  search.value = searchInput.value;
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-2xl flex-col border-x border-gray-200">
    <header class="flex items-center gap-3 p-4">
      <input
        type="text"
        placeholder="Search"
        class="flex-1 rounded-md border border-gray-300 px-3 py-2"
        v-model="searchInput"
        @keyup.enter="handleSearch"
      />
      <button class="rounded-md border border-gray-300 px-3 py-2" @click="handleSearch">
        Search
      </button>
      <button class="h-10 w-10 rounded-full border border-gray-300"></button>
    </header>

    <TodoList :search="search" />
  </div>
</template>
