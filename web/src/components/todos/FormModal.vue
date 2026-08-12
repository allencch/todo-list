<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  close: [];
  submit: [
    payload: {
      name: string;
      description?: string;
      dueDate?: string;
      priority?: 'low' | 'medium' | 'high';
    },
  ];
}>();

const name = ref('');
const description = ref('');
const dueDate = ref('');
const priority = ref<'low' | 'medium' | 'high' | ''>('');

function handleSubmit() {
  emit('submit', {
    name: name.value,
    description: description.value || undefined,
    dueDate: dueDate.value || undefined,
    priority: priority.value || undefined,
  });
}
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm rounded-md bg-white p-4">
      <h2 class="mb-3 text-lg font-medium">New todo</h2>

      <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
        <input
          v-model="name"
          type="text"
          placeholder="Name"
          required
          class="rounded-md border border-gray-300 px-3 py-2"
        />
        <textarea
          v-model="description"
          placeholder="Description"
          class="rounded-md border border-gray-300 px-3 py-2"
        ></textarea>
        <input
          v-model="dueDate"
          type="date"
          class="rounded-md border border-gray-300 px-3 py-2"
        />
        <select v-model="priority" class="rounded-md border border-gray-300 px-3 py-2">
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-2"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button type="submit" class="rounded-md border border-gray-300 px-3 py-2">
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
