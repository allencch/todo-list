<script setup lang="ts">
defineProps<{ message: string }>();
const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/50 z-10"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm rounded-md bg-white p-4">
      <h2 class="mb-3 text-lg font-medium">Error</h2>
      <p class="text-sm text-gray-500">{{ message }}</p>
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
