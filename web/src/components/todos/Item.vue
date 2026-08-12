<script setup lang="ts">
import { ref } from 'vue';
import type { TodoItem } from '@/types/todo';

defineProps<{ todo: TodoItem }>();

const expanded = ref(false);
</script>

<template>
  <li class="px-3 py-2">
    <button
      type="button"
      class="flex w-full items-center gap-2 text-left"
      @click="expanded = !expanded"
    >
      <span class="inline-block transition-transform" :class="{ 'rotate-90': expanded }">></span>
      {{ todo.name }}
    </button>

    <div v-if="expanded" class="mt-2 text-sm text-gray-500">
      <p v-if="todo.description">{{ todo.description }}</p>
      <p>Status: {{ todo.status }}</p>
      <p v-if="todo.priority">Priority: {{ todo.priority }}</p>
    </div>
  </li>
</template>
