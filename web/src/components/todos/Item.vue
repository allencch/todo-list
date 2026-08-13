<script setup lang="ts">
import { ref } from 'vue';
import {
  Pencil,
  ChevronRight,
  Trash2,
  Flag,
  Circle,
  CircleDot,
  CircleCheck,
  Archive,
  Repeat,
} from '@lucide/vue';
import type { TodoItem } from '@/types/todo';
import FormModal from './FormModal.vue';
import DeleteModal from './DeleteModal.vue';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import { safeParseJson, buildErrorMessage } from '@/utils/http';

const props = defineProps<{ todo: TodoItem }>();

const statuses = ['not_started', 'in_progress', 'completed', 'archived'];
const priorities: (string | null)[] = ['low', 'medium', 'high', null];

const priorityColors: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-blue-500',
};

const statusIcons: Record<string, unknown> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CircleCheck,
  archived: Archive,
};

const statusColors: Record<string, string> = {
  not_started: 'text-gray-400',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  archived: 'text-gray-400',
};

function humanize(value: string) {
  const words = value.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const recurUnitNouns: Record<string, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

function recurLabel(recurType: string, recurValue: number) {
  const unit = recurUnitNouns[recurType] ?? recurType;
  return `Repeat every ${recurValue} ${unit}${recurValue === 1 ? '' : 's'}`;
}

const emit = defineEmits<{
  submit: [todo: TodoItem];
  delete: [todo: TodoItem];
}>();

const expanded = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showErrorModal = ref(false);
const errorMessage = ref('');

function handleSubmit(todo: TodoItem) {
  showEditModal.value = false;
  emit('submit', todo);
}

function handleDelete(todo: TodoItem) {
  showDeleteModal.value = false;
  emit('delete', todo);
}

async function changeStatus(status: string) {
  if (status === props.todo.status) return;

  const response =
    status === 'completed'
      ? await fetch(`/api/todos/${props.todo.id}/complete`, { method: 'POST' })
      : await fetch(`/api/todos/${props.todo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
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
      <Repeat v-if="todo.recurType" class="h-4 w-4 shrink-0 text-gray-400" />
      <span v-if="todo.dueDate" class="shrink-0 text-sm text-gray-500">
        {{ new Date(todo.dueDate).toLocaleDateString() }}
      </span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          aria-label="Edit"
          class="cursor-pointer text-gray-500"
          @click="showEditModal = true"
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
      <p v-if="todo.recurType">{{ recurLabel(todo.recurType, todo.recurValue ?? 1) }}</p>
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
      </div>
      <div class="mt-1 flex flex-wrap gap-1">
        <button
          v-for="priority in priorities"
          :key="priority ?? 'none'"
          type="button"
          class="cursor-pointer rounded-md border px-2 py-1 text-xs"
          :class="
            priority === (todo.priority ?? null)
              ? priority
                ? `border-current bg-gray-100 font-medium ${priorityColors[priority]}`
                : 'border-gray-400 bg-gray-100 font-medium text-gray-700'
              : 'border-gray-200 text-gray-500'
          "
          @click="changePriority(priority)"
        >
          {{ priority ? humanize(priority) : 'None' }}
        </button>
      </div>
    </div>

    <FormModal
      v-if="showEditModal"
      :todo="todo"
      @close="showEditModal = false"
      @submit="handleSubmit"
    />
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
