<script setup lang="ts">
import { ref } from 'vue';
import { Pencil, ChevronRight, Trash2, Flag } from '@lucide/vue';
import type { TodoItem } from '@/types/todo';
import FormModal from './FormModal.vue';
import DeleteModal from './DeleteModal.vue';

defineProps<{ todo: TodoItem }>();

const priorityColors: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-blue-500',
};

const emit = defineEmits<{
  submit: [todo: TodoItem];
  delete: [todo: TodoItem];
}>();

const expanded = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);

function handleSubmit(todo: TodoItem) {
  showEditModal.value = false;
  emit('submit', todo);
}

function handleDelete(todo: TodoItem) {
  showDeleteModal.value = false;
  emit('delete', todo);
}
</script>

<template>
  <li class="px-3 py-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex flex-1 cursor-pointer items-center gap-2 text-left"
        @click="expanded = !expanded"
      >
        <span class="inline-block transition-transform" :class="{ 'rotate-90': expanded }"
          ><ChevronRight class="h-4 w-4" /></span
        >
        <Flag v-if="todo.priority" class="h-4 w-4" :class="priorityColors[todo.priority]" />
        {{ todo.name }}
      </button>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Edit"
          class="cursor-pointer text-gray-500"
          @click="showEditModal = true"
        >
          <Pencil class="h-4 w-4" />
        </button>
        <button type="button" aria-label="Delete" class="cursor-pointer text-red-500">
          <Trash2 class="h-4 w-4" @click="showDeleteModal = true" />
        </button>
      </div>
    </div>

    <div v-if="expanded" class="mt-2 text-sm text-gray-500">
      <p v-if="todo.description">{{ todo.description }}</p>
      <p>Status: {{ todo.status }}</p>
      <p v-if="todo.priority">Priority: {{ todo.priority }}</p>
    </div>

    <FormModal
      v-if="showEditModal"
      :todo="todo"
      @close="showEditModal = false"
      @submit="handleSubmit"
    />
    <DeleteModal
      v-if="showDeleteModal"
      :todo="todo"
      @close="showDeleteModal = false"
      @submit="handleDelete"
    />
  </li>
</template>
