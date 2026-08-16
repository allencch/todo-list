<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

const props = withDefaults(
  defineProps<{
    message: string;
    duration?: number;
  }>(),
  { duration: 4000 },
);

const emit = defineEmits<{
  close: [];
}>();

let timeoutId: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  timeoutId = setTimeout(() => emit('close'), props.duration);
});

onBeforeUnmount(() => {
  clearTimeout(timeoutId);
});
</script>

<template>
  <div
    class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-md bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
    role="status"
  >
    {{ message }}
    <button type="button" class="text-gray-300 hover:text-white" @click="emit('close')">
      x
    </button>
  </div>
</template>
