<script setup lang="ts">
import { ref } from 'vue';
import FormModal from '@/components/todos/FormModal.vue';
import type { TodoItem } from '@/types/todo';

const emit = defineEmits<{
  submit: [todo: TodoItem];
}>();

const showModal = ref(false);

function handleSubmit(todo: TodoItem) {
  showModal.value = false;
  emit('submit', todo);
}
</script>

<template>
  <button class="rounded-md border border-gray-300 px-3 py-2" @click="showModal = true">
    Add
  </button>

  <FormModal v-if="showModal" @close="showModal = false" @submit="handleSubmit" />
</template>
