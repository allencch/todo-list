<script setup lang="ts">
import { ref } from 'vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import type { TodoItem } from '@/types/todo';
import { safeParseJson, buildErrorMessage } from '@/utils/http';

const props = defineProps<{ todo: TodoItem }>();

const emit = defineEmits<{
  close: [];
  submit: [todo: TodoItem];
}>();

const showErrorModal = ref(false);
const errorMessage = ref('');

async function handleDelete() {
  const response = await fetch(`/api/todos/${props.todo.id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const body = await safeParseJson(response);
    errorMessage.value = buildErrorMessage(body);
    showErrorModal.value = true;
    return;
  }

  emit('submit', props.todo);
}
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm rounded-md bg-white p-4">
      <h2 class="mb-3 text-lg font-medium">Confirm delete?</h2>
      <p class="text-sm text-gray-500">{{ todo.name }}</p>
      <div class="mt-2 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-gray-300 px-3 py-2"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-md border border-red-300 px-3 py-2 text-red-600"
          @click="handleDelete"
        >
          Delete
        </button>
      </div>
    </div>
  </div>

  <ErrorModal
    v-if="showErrorModal"
    :message="errorMessage"
    @close="showErrorModal = false"
  />
</template>
