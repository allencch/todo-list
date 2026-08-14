<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

function openCreate() {
  router.push({ query: { ...route.query, new: '1' } });
}
</script>

<template>
  <button class="rounded-md border border-gray-300 px-3 py-2" @click="openCreate">Add</button>
</template>
