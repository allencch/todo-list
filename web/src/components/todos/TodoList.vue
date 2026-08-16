<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import ListTodoFilters from '@/components/todos/ListTodoFilters.vue';
import ListTodoSort from '@/components/todos/ListTodoSort.vue';
import FormPanel from '@/components/todos/FormPanel.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import Toast from '@/components/shared/Toast.vue';
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
const isCreating = computed(() => route.query.new === '1');

const mainRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
let listResizeObserver: ResizeObserver | null = null;

async function fillViewportIfNeeded() {
  await nextTick();
  const el = mainRef.value;
  while (el && nextCursor.value && el.scrollHeight <= el.clientHeight) {
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

onMounted(() => {
  fetchTodos();

  if (listRef.value) {
    listResizeObserver = new ResizeObserver(() => {
      fillViewportIfNeeded();
    });
    listResizeObserver.observe(listRef.value);
  }
});

onBeforeUnmount(() => {
  listResizeObserver?.disconnect();
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
    <div class="flex w-3/5 flex-col overflow-hidden border-r border-gray-200">
      <ListTodoFilters @change="handleFilterChange">
        <AddItem />
      </ListTodoFilters>

      <ListTodoSort @change="handleFilterChange" />

      <main ref="mainRef" class="flex-1 overflow-y-auto px-4 py-4" @scroll="handleListScroll">
        <ul ref="listRef" class="divide-y divide-gray-200 rounded-md border border-gray-300">
          <Item
            v-for="todo in todos"
            :key="todo.id"
            :todo="todo"
            @submit="handleUpdate"
            @delete="handleDelete"
            @complete="handleComplete"
          />
        </ul>
        <p v-if="isLoadingMore" class="py-3 text-center text-sm text-gray-400">Loading more...</p>
      </main>
    </div>

    <div class="flex w-2/5 flex-col overflow-y-auto">
      <FormPanel
        v-if="editingTodo || isCreating"
        :key="editingTodo?.id ?? 'new'"
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
