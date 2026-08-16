<script setup lang="ts">
interface SummaryTodo {
  id: number;
  name: string;
  priority?: string | null;
  status?: string;
  dueDate?: string | null;
}

withDefaults(
  defineProps<{
    message: string;
    todos?: SummaryTodo[];
  }>(),
  { todos: () => [] },
);

const emit = defineEmits<{
  close: [];
  edit: [id: number];
}>();
</script>

<template>
  <div
    class="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4"
    @click.self="emit('close')"
  >
    <div class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md bg-white p-4">
      <h2 class="mb-3 text-lg font-medium">Task Summary</h2>
      <p class="whitespace-pre-line text-sm text-gray-600">{{ message }}</p>

      <div v-if="todos.length" class="mt-4">
        <p class="mb-1 text-xs font-medium text-gray-700">Based on these tasks</p>
        <div class="flex flex-col gap-1">
          <button
            v-for="todo in todos"
            :key="todo.id"
            type="button"
            class="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-50"
            @click="emit('edit', todo.id)"
          >
            <span class="underline decoration-dotted">({{ todo.id }}) {{ todo.name }}</span>
          </button>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-gray-300 px-3 py-2"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
