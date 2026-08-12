<script setup lang="ts">
import type { TodoItem } from '@/types/todo';

defineProps<{ todo: TodoItem }>();
</script>

<template>
  <li class="px-3 py-2">
    {{ todo.name }}
  </li>
</template>
