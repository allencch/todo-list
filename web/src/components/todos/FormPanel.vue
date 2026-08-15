<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TodoItem } from '@/types/todo';
import ErrorModal from '@/components/shared/ErrorModal.vue';
import DaySelection from './DaySelection.vue';
import TodoDependencies from './TodoDependencies.vue';
import { safeParseJson, buildErrorMessage } from '@/utils/http';

const props = defineProps<{ todo?: TodoItem }>();

const emit = defineEmits<{
  close: [];
  submit: [todo: TodoItem];
}>();

const todoId = ref(props.todo?.id ?? null);
const name = ref(props.todo?.name ?? '');
const description = ref(props.todo?.description ?? '');
const dueDate = ref(props.todo?.dueDate?.slice(0, 10) ?? '');
const priority = ref<'low' | 'medium' | 'high' | ''>(
  (props.todo?.priority as 'low' | 'medium' | 'high') ?? '',
);
const recurType = ref<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | ''>(
  (props.todo?.recurType as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') ?? '',
);
const recurValue = ref(props.todo?.recurValue ?? 1);

const dependencies = ref<{ id: number; name: string }[]>([]);

function addDependency(dependency: { id: number; name: string }) {
  if (!dependencies.value.some((d) => d.id === dependency.id)) {
    dependencies.value.push(dependency);
  }
}

function removeDependency(dependencyId: number) {
  dependencies.value = dependencies.value.filter((d) => d.id !== dependencyId);
}

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const weekdayValues = [0, 1, 2, 3, 4, 5, 6];
const monthDayValues = Array.from({ length: 31 }, (_, i) => i + 1);

const customBasis = ref<'weekly' | 'monthly'>(props.todo?.recurCustom?.type ?? 'weekly');
const customWeekdays = ref<number[]>(
  props.todo?.recurCustom?.type === 'weekly' ? [...props.todo.recurCustom.weekdays] : [],
);
const customMonthDays = ref<number[]>(
  props.todo?.recurCustom?.type === 'monthly' ? [...props.todo.recurCustom.monthDays] : [],
);

const isCustomRecurrenceIncomplete = computed(() => {
  return (
    recurType.value === 'custom' &&
    ((customBasis.value === 'weekly' && customWeekdays.value.length === 0) ||
      (customBasis.value === 'monthly' && customMonthDays.value.length === 0))
  );
});

const showErrorModal = ref(false);
const errorMessage = ref('');

function buildRecurFields() {
  if (!recurType.value) {
    return { recurType: null, recurValue: null };
  }

  if (recurType.value === 'custom') {
    const recurCustom =
      customBasis.value === 'weekly'
        ? { type: 'weekly', weekdays: [...customWeekdays.value].sort((a, b) => a - b) }
        : { type: 'monthly', monthDays: [...customMonthDays.value].sort((a, b) => a - b) };

    return { recurType: 'custom', recurValue: null, recurCustom };
  }

  return { recurType: recurType.value, recurValue: Number(recurValue.value) };
}

function createTodo() {
  return fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.value,
      description: description.value || undefined,
      dueDate: dueDate.value || undefined,
      priority: priority.value || undefined,
      ...buildRecurFields(),
    }),
  });
}

function patchTodo() {
  return fetch(`/api/todos/${todoId.value}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.value,
      description: description.value || undefined,
      dueDate: dueDate.value || undefined,
      priority: priority.value || undefined,
      ...buildRecurFields(),
    }),
  });
}

async function handleSubmit() {
  const response = todoId.value ? await patchTodo() : await createTodo();

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
  <div class="h-full overflow-y-auto p-4">
    <h2 class="mb-3 text-lg font-medium">{{ todo ? 'Edit todo' : 'New todo' }}</h2>

    <form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
        <input
          v-model="name"
          type="text"
          placeholder="Name"
          required
          class="rounded-md border border-gray-300 px-3 py-2"
        />
        <textarea
          v-model="description"
          placeholder="Description"
          class="rounded-md border border-gray-300 px-3 py-2"
          rows="6"
        ></textarea>
        <input
          v-model="dueDate"
          type="date"
          class="rounded-md border border-gray-300 px-3 py-2"
        />
        <select v-model="priority" class="rounded-md border border-gray-300 px-3 py-2">
          <option value="">Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div class="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
          <div class="flex gap-2">
            <select v-model="recurType" class="flex-1 rounded-md border border-gray-300 px-3 py-2">
              <option value="">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
            <div v-if="recurType && recurType !== 'custom'" class="flex items-center gap-2">
              <span class="text-sm text-gray-500">Every</span>
              <input
                v-model.number="recurValue"
                type="number"
                min="1"
                class="w-16 rounded-md border border-gray-300 px-3 py-2"
              />
              <span class="text-sm text-gray-500">{{ recurType }}(s)</span>
            </div>
          </div>

          <div v-if="recurType === 'custom'" class="flex flex-col gap-2">
            <select v-model="customBasis" class="rounded-md border border-gray-300 px-3 py-2">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <DaySelection
              v-if="customBasis === 'weekly'"
              v-model="customWeekdays"
              :days="weekdayValues"
              :labels="weekdayLabels"
            />
            <DaySelection v-else v-model="customMonthDays" :days="monthDayValues" shape="square" />
          </div>
        </div>

        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-2"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-md border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isCustomRecurrenceIncomplete"
          >
            {{ todo ? 'Save' : 'Create' }}
          </button>
        </div>
      </form>

    <TodoDependencies
      class="mt-3"
      :exclude-id="todoId ?? 0"
      :dependencies="dependencies"
      @select="addDependency"
      @remove="removeDependency"
    />
  </div>

  <ErrorModal
    v-if="showErrorModal"
    :message="errorMessage"
    @close="showErrorModal = false"
  />
</template>
