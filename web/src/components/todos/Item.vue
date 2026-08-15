<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Pencil, ChevronRight, Trash2, Flag, Repeat } from '@lucide/vue';
import type { TodoItem } from '@/types/todo';
import DeleteModal from './DeleteModal.vue';
import DependencyList from './DependencyList.vue';
import PriorityPicker from './PriorityPicker.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import { safeParseJson, buildErrorMessage } from '@/utils/http';
import { recurLabel, statusIcons, statusColors, priorityColors, humanize } from '@/utils/todo.util.ts';

const props = defineProps<{ todo: TodoItem }>();

const route = useRoute();
const router = useRouter();

const statuses = ['not_started', 'in_progress', 'archived'];

const emit = defineEmits<{
  submit: [todo: TodoItem];
  delete: [todo: TodoItem];
  complete: [];
}>();

const expanded = ref(false);
const showDeleteModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');

function openEdit() {
  const { new: _new, ...rest } = route.query;
  router.push({ query: { ...rest, edit: String(props.todo.id) } });
}

function handleDelete(todo: TodoItem) {
  showDeleteModal.value = false;
  emit('delete', todo);
}

async function changeStatus(status: string) {
  if (status === props.todo.status) return;

  const response = await fetch(`/api/todos/${props.todo.id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status
    }),
  });

  if (!response.ok) {
    const body = await safeParseJson(response);
    errorMessage.value = buildErrorMessage(body);
    showErrorModal.value = true;
    return;
  }

  if (status === 'completed') {
    emit('complete');
    return;
  }

  const todo = await response.json();
  emit('submit', todo);
}

function toggleComplete() {
  changeStatus(props.todo.status === 'completed' ? 'not_started' : 'completed');
}

async function changePriority(priority: string | null) {
  if (priority === (props.todo.priority ?? null)) return;

  const response = await fetch(`/api/todos/${props.todo.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority }),
  });

  if (!response.ok) {
    const body = await safeParseJson(response);
    errorMessage.value = buildErrorMessage(body);
    showErrorModal.value = true;
    return;
  }

  const todo = await response.json();
  emit('submit', todo);
}
</script>

<template>
  <li class="px-3 py-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex flex-1 cursor-pointer items-center gap-2 text-left"
        @click="expanded = !expanded"
      >
        <span class="inline-block transition-transform" :class="{ 'rotate-90': expanded }"
          ><ChevronRight class="h-4 w-4" /></span
        >
        <component
          :is="statusIcons[todo.status]"
          class="h-4 w-4 shrink-0"
          :class="statusColors[todo.status]"
        />
        <Flag v-if="todo.priority" class="h-4 w-4" :class="priorityColors[todo.priority]" />
        {{ todo.name }}
      </button>
      <div
        v-if="todo.recurType || todo.dueDate"
        class="flex shrink-0 items-center gap-1 text-sm text-gray-500"
      >
        <Repeat v-if="todo.recurType" class="h-4 w-4 shrink-0 text-gray-400" />
        <span v-if="todo.dueDate">{{ new Date(todo.dueDate).toLocaleDateString() }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Edit"
          class="cursor-pointer text-gray-500"
          @click="openEdit"
        >
          <Pencil class="h-4 w-4" />
        </button>
        <button type="button" aria-label="Delete" class="cursor-pointer text-red-500">
          <Trash2 class="h-4 w-4" @click="showDeleteModal = true" />
        </button>
      </div>
    </div>

    <div v-if="expanded" class="mt-2 text-sm text-gray-500">
      <p v-if="todo.description">{{ todo.description }}</p>
      <hr v-if="todo.description" class="my-2" />
      <p v-if="todo.recurType">
        {{ recurLabel(todo.recurType, todo.recurValue ?? 1, todo.recurCustom) }}
      </p>
      <p v-if="todo.nextDueDate">Next: {{ new Date(todo.nextDueDate).toLocaleDateString() }}</p>
      <div class="mt-1 flex flex-wrap gap-1">
        <button
          v-for="status in statuses"
          :key="status"
          type="button"
          class="cursor-pointer rounded-md border px-2 py-1 text-xs"
          :class="
            status === todo.status
              ? 'border-gray-400 bg-gray-100 font-medium text-gray-700'
              : 'border-gray-200 text-gray-500'
          "
          @click="changeStatus(status)"
        >
          {{ humanize(status) }}
        </button>
        <button
          type="button"
          class="ml-auto cursor-pointer rounded-md border px-2 py-1 text-xs"
          :class="
            todo.status === 'completed'
              ? 'border-green-400 bg-green-100 font-medium text-green-700'
              : 'border-green-300 text-green-600'
          "
          @click="toggleComplete"
        >
          Complete
        </button>
      </div>
      <PriorityPicker
        class="mt-1"
        :model-value="(todo.priority as 'low' | 'medium' | 'high') ?? null"
        @update:model-value="changePriority"
      />
      <div v-if="todo.dependencies?.length" class="mt-2">
        <p class="mb-1 text-xs font-medium text-gray-700">Dependencies</p>
        <DependencyList :dependencies="todo.dependencies" readonly />
      </div>
    </div>

    <DeleteModal
      v-if="showDeleteModal"
      :todo="todo"
      @close="showDeleteModal = false"
      @submit="handleDelete"
    />
    <ErrorModal
      v-if="showErrorModal"
      :message="errorMessage"
      @close="showErrorModal = false"
    />
  </li>
</template>
