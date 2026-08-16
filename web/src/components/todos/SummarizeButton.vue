<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Sparkles, LoaderCircle } from '@lucide/vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import SummaryModal from '@/components/shared/SummaryModal.vue';
import { safeParseJson, buildErrorMessage } from '@/utils/http';

const route = useRoute();
const router = useRouter();

const SUMMARIZE_TIMEOUT_MS = 120_000;

const isSummarizing = ref(false);
const showSummaryModal = ref(false);
const summaryMessage = ref('');
const summaryTodos = ref([]);
const showErrorModal = ref(false);
const errorMessage = ref('');

async function handleSummarize() {
  if (isSummarizing.value) return;
  isSummarizing.value = true;

  const timeout = AbortSignal.timeout(SUMMARIZE_TIMEOUT_MS);

  try {
    const response = await fetch('/api/ai-summarize', { signal: timeout });
    const body = await safeParseJson(response);

    if (!response.ok) {
      errorMessage.value = buildErrorMessage(body);
      showErrorModal.value = true;
      return;
    }

    summaryMessage.value = body.summary;
    summaryTodos.value = body.todos;
    showSummaryModal.value = true;
  } catch (err) {
    errorMessage.value =
      err instanceof DOMException && err.name === 'TimeoutError'
        ? 'The AI model took too long to respond. Please try again.'
        : 'Failed to reach the server.';
    showErrorModal.value = true;
  } finally {
    isSummarizing.value = false;
  }
}

function handleEdit(id: number) {
  showSummaryModal.value = false;
  const { new: _new, ...rest } = route.query;
  router.push({ query: { ...rest, edit: String(id) } });
}
</script>

<template>
  <button
    type="button"
    aria-label="Summarize top tasks"
    title="Summarize top tasks"
    class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
    :disabled="isSummarizing"
    @click="handleSummarize"
  >
    <LoaderCircle v-if="isSummarizing" class="h-4 w-4 animate-spin" />
    <Sparkles v-else class="h-4 w-4" />
  </button>

  <SummaryModal
    v-if="showSummaryModal"
    :message="summaryMessage"
    :todos="summaryTodos"
    @close="showSummaryModal = false"
    @edit="handleEdit"
  />
  <ErrorModal
    v-if="showErrorModal"
    :message="errorMessage"
    @close="showErrorModal = false"
  />
</template>
