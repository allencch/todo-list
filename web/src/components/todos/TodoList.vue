<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVirtualizer } from '@tanstack/vue-virtual';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import ListTodoFilters from '@/components/todos/ListTodoFilters.vue';
import ListTodoSort from '@/components/todos/ListTodoSort.vue';
import FormPanel from '@/components/todos/FormPanel.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import Toast from '@/components/shared/Toast.vue';
import { onTodoChanged } from '@/utils/ws';
import type { TodoItem } from '@/types/todo';

const props = defineProps<{ search?: string }>();

const route = useRoute();
const router = useRouter();

const PAGE_SIZE = 20;

const todos = ref<TodoItem[]>([]);
const filterState = ref<Record<string, string>>({ status: '' });
const error = ref('');
const toastMessage = ref('');
const nextCursor = ref<string | null>(null);
const isLoadingMore = ref(false);

const editingTodo = ref<TodoItem | null>(null);
const formPanelKey = ref(0);
const isCreating = computed(() => route.query.new === '1');

const mainRef = ref<HTMLElement | null>(null);
let mainResizeObserver: ResizeObserver | null = null;

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: todos.value.length,
    getScrollElement: () => mainRef.value,
    estimateSize: () => 56,
    overscan: 8,
    getItemKey: (index: number) => todos.value[index]?.id ?? index,
  }))
);

const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

function measureItem(el: unknown) {
  const domEl = (el as { $el?: Element })?.$el;
  if (domEl) {
    rowVirtualizer.value.measureElement(domEl);
  }
}

async function fillViewportIfNeeded() {
  await nextTick();
  const el = mainRef.value;
  while (el && el.clientHeight > 0 && nextCursor.value && el.scrollHeight <= el.clientHeight) {
    await loadMoreTodos();
    await nextTick();
  }
}

function sanitizeQueryParams() {
  const cleanedParams = Object.fromEntries(
    Object.entries(filterState.value).filter(([key, value]) => value !== '')
  );
  return cleanedParams;
}

async function fetchTodos() {
  try {
    const params = new URLSearchParams(sanitizeQueryParams());
    params.set('pageSize', String(PAGE_SIZE));
    const response = await fetch(`/api/todos?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to load todos (${response.status})`);
    }
    const body = await response.json();
    todos.value = body.data;
    nextCursor.value = body.nextCursor;
    fillViewportIfNeeded();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load todos';
  }
}

async function loadMoreTodos() {
  if (!nextCursor.value || isLoadingMore.value) return;

  isLoadingMore.value = true;
  try {
    const params = new URLSearchParams(sanitizeQueryParams());
    params.set('pageSize', String(PAGE_SIZE));
    params.set('cursor', nextCursor.value);
    const response = await fetch(`/api/todos?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to load todos (${response.status})`);
    }
    const body = await response.json();
    todos.value.push(...body.data);
    nextCursor.value = body.nextCursor;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load todos';
  } finally {
    isLoadingMore.value = false;
  }
}

function handleListScroll(event: Event) {
  const el = event.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    loadMoreTodos();
  }
}

let unsubscribeTodoChanged: (() => void) | null = null;

onMounted(() => {
  fetchTodos();

  if (mainRef.value) {
    mainResizeObserver = new ResizeObserver(() => {
      fillViewportIfNeeded();
    });
    mainResizeObserver.observe(mainRef.value);
  }

  unsubscribeTodoChanged = onTodoChanged(handleTodoChanged);
});

onBeforeUnmount(() => {
  mainResizeObserver?.disconnect();
  unsubscribeTodoChanged?.();
});

function handleUpdate(todo: TodoItem) {
  const index = todos.value.findIndex((item) => item.id === todo.id);
  if (index !== -1) {
    todos.value[index] = todo;
  }
}

function handleDelete(todo: TodoItem) {
  const index = todos.value.findIndex((item) => item.id === todo.id);
  if (index !== -1) {
    todos.value.splice(index, 1);
  }
}

function handleComplete(nextDueDate: string | null) {
  fetchTodos();

  if (nextDueDate) {
    toastMessage.value = `Completed - next one due ${new Date(nextDueDate).toLocaleDateString()}`;
  }
}

// Received over the WebSocket whenever another tab/client changes a todo.
// Only fetches the single item (not the whole list) and patches it in place
// if it's part of the current view; a todo not currently loaded is left alone.
async function handleTodoChanged(id: number) {
  const isEditingThisTodo = editingTodo.value?.id === id;
  const response = await fetch(`/api/todos/${id}`);

  if (response.status === 404) {
    const index = todos.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      todos.value.splice(index, 1);
    }
    if (isEditingThisTodo) {
      toastMessage.value = 'The todo you were editing was deleted elsewhere.';
      closePanel();
    }
    return;
  }

  if (!response.ok) return;

  const updated = await response.json();
  const index = todos.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    todos.value[index] = updated;
  }

  if (isEditingThisTodo) {
    // Bumping the key forces FormPanel to remount, so its fields (initialized
    // once from the `todo` prop at setup) re-sync from the fresh data.
    editingTodo.value = updated;
    formPanelKey.value++;
    toastMessage.value = `"${updated.name}" was updated elsewhere and refreshed.`;
  }
}

function handleFilterChange(filter: Record<string, string>) {
  Object.assign(filterState.value, filter);
  fetchTodos();
}

watch(
  () => props.search,
  (search) => {
    filterState.value.content = search ?? '';
    fetchTodos();
  }
);

async function fetchEditingTodo(id: string) {
  try {
    const response = await fetch(`/api/todos/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to load todo (${response.status})`);
    }
    editingTodo.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load todo';
  }
}

watch(
  () => route.query.edit,
  (edit) => {
    if (typeof edit === 'string') {
      fetchEditingTodo(edit);
    } else {
      editingTodo.value = null;
    }
  },
  { immediate: true }
);

function closePanel() {
  const { edit, new: _new, ...rest } = route.query;
  router.replace({ query: rest });
}

function handlePanelSubmit() {
  fetchTodos();
  closePanel();
}
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <div
      class="overflow-hidden border-gray-200 md:flex md:w-3/5 md:flex-col md:border-r"
      :class="editingTodo || isCreating ? 'hidden' : 'flex w-full flex-col'"
    >
      <ListTodoFilters @change="handleFilterChange">
        <AddItem />
      </ListTodoFilters>

      <ListTodoSort @change="handleFilterChange" />

      <main ref="mainRef" class="flex-1 overflow-y-auto px-4 py-4" @scroll="handleListScroll">
        <ul
          class="relative divide-y divide-gray-200 rounded-md border border-gray-300"
          :style="{ height: `${totalSize}px` }"
        >
          <template v-for="virtualRow in virtualRows" :key="virtualRow.key">
            <Item
              v-if="todos[virtualRow.index]"
              :ref="measureItem"
              :data-index="virtualRow.index"
              :todo="todos[virtualRow.index]!"
              class="absolute top-0 left-0 w-full"
              :style="{ transform: `translateY(${virtualRow.start}px)` }"
              @submit="handleUpdate"
              @delete="handleDelete"
              @complete="handleComplete"
            />
          </template>
        </ul>
        <p v-if="isLoadingMore" class="py-3 text-center text-sm text-gray-400">Loading more...</p>
      </main>
    </div>

    <div
      class="overflow-y-auto md:flex md:w-2/5 md:flex-col"
      :class="editingTodo || isCreating ? 'flex w-full flex-col' : 'hidden'"
    >
      <FormPanel
        v-if="editingTodo || isCreating"
        :key="`${editingTodo?.id ?? 'new'}-${formPanelKey}`"
        :todo="editingTodo ?? undefined"
        @close="closePanel"
        @submit="handlePanelSubmit"
        @complete="handleComplete"
      />
      <div v-else class="flex h-full items-center justify-center p-4 text-sm text-gray-400">
        Select a todo to view details
      </div>
    </div>
  </div>

  <ErrorModal v-if="error" :message="error" @close="error = ''" />
  <Toast v-if="toastMessage" :message="toastMessage" @close="toastMessage = ''" />
</template>
