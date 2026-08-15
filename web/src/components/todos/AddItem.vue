<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

function openCreate() {
  const { edit, ...rest } = route.query;
  router.push({ query: { ...rest, new: '1' } });
}
</script>

<template>
  <button class="rounded-md border border-gray-300 px-3 py-2" @click="openCreate">Add</button>
</template>
