<script setup lang="ts">
import { ref } from 'vue';
import FormModal from '@/components/todos/FormModal.vue';

const showModal = ref(false);
</script>

<template>
  <button class="rounded-md border border-gray-300 px-3 py-2" @click="showModal = true">
    Add
  </button>

  <FormModal v-if="showModal" @close="showModal = false" @submit="showModal = false" />
</template>
