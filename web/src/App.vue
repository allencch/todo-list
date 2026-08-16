<script setup lang="ts">
import { ref } from 'vue';
import TodoList from '@/components/todos/TodoList.vue';
import SummarizeButton from '@/components/todos/SummarizeButton.vue';

const searchInput = ref('');
const search = ref('');

function handleSearch() {
  search.value = searchInput.value;
}
</script>

<template>
  <div class="flex h-screen flex-col md:mx-32">
    <header class="flex items-center gap-3 p-4">
      <input
        v-model="searchInput"
        type="text"
        placeholder="Search"
        class="flex-1 rounded-md border border-gray-300 px-3 py-2"
        @keyup.enter="handleSearch"
      />
      <button class="rounded-md border border-gray-300 px-3 py-2" @click="handleSearch">
        Search
      </button>
      <SummarizeButton />
    </header>

    <TodoList :search="search" />
  </div>
</template>
