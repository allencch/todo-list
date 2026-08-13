<script setup lang="ts">
const props = defineProps<{
  days: number[];
  labels?: string[];
  modelValue: number[];
  shape?: 'circle' | 'square';
}>();

const emit = defineEmits<{
  'update:modelValue': [days: number[]];
}>();

function toggle(day: number) {
  const next = props.modelValue.includes(day)
    ? props.modelValue.filter((d) => d !== day)
    : [...props.modelValue, day];
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="grid grid-cols-7 w-max gap-1">
    <button
      v-for="(day, index) in days"
      :key="day"
      type="button"
      class="h-8 w-8 cursor-pointer border text-xs"
      :class="[
        shape === 'square' ? 'rounded-md' : 'rounded-full',
        modelValue.includes(day)
          ? 'border-blue-400 bg-blue-100 font-medium text-blue-700'
          : 'border-gray-200 text-gray-500',
      ]"
      @click="toggle(day)"
    >
      {{ labels?.[index] ?? day }}
    </button>
  </div>
</template>
