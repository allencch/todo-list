<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Item from '@/components/todos/Item.vue';
import AddItem from '@/components/todos/AddItem.vue';
import ListTodoFilters from '@/components/todos/ListTodoFilters.vue';
import ListTodoSort from '@/components/todos/ListTodoSort.vue';
import FormModal from '@/components/todos/FormModal.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import type { TodoItem } from '@/types/todo';

const props = defineProps<{ search?: string }>();

const route = useRoute();
const router = useRouter();

const todos = ref<TodoItem[]>([]);
const filterState = ref<Record<string, string>>({ status: '' });
const error = ref('');

const editingTodo = ref<TodoItem | null>(null);
const isCreating = computed(() => route.query.new === '1');

function sanitizeQueryParams() {
  const cleanedParams = Object.fromEntries(
    Object.entries(filterState.value).filter(([key, value]) => value !== '')
  );
  return cleanedParams;
}

async function fetchTodos() {
  try {
    const params = new URLSearchParams(sanitizeQueryParams());
    const response = await fetch(`/api/todos?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to load todos (${response.status})`);
    }
    todos.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load todos';
  }
}

onMounted(fetchTodos);

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

      <main class="flex-1 overflow-y-auto px-4 py-4">
        <ul class="divide-y divide-gray-200 rounded-md border border-gray-300">
          <Item
            :todo="todo"
            v-for="todo in todos"
            :key="todo.id"
            @submit="handleUpdate"
            @delete="handleDelete"
            @complete="fetchTodos"
          />
        </ul>
      </main>
    </div>

    <div class="flex w-2/5 flex-col overflow-y-auto">
      <FormModal
        v-if="editingTodo || isCreating"
        :key="editingTodo?.id ?? 'new'"
        :todo="editingTodo ?? undefined"
        @close="closePanel"
        @submit="handlePanelSubmit"
      />
      <div v-else class="flex h-full items-center justify-center p-4 text-sm text-gray-400">
        Select a todo to view details
      </div>
    </div>
  </div>

  <ErrorModal v-if="error" :message="error" @close="error = ''" />
</template>
