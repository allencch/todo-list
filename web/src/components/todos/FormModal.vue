<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TodoItem } from '@/types/todo';
import ErrorModal from '@/components/shared/ErrorModal.vue';
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

const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

function toggleWeekday(day: number) {
  const index = customWeekdays.value.indexOf(day);
  if (index === -1) {
    customWeekdays.value.push(day);
  } else {
    customWeekdays.value.splice(index, 1);
  }
}

function toggleMonthDay(day: number) {
  const index = customMonthDays.value.indexOf(day);
  if (index === -1) {
    customMonthDays.value.push(day);
  } else {
    customMonthDays.value.splice(index, 1);
  }
}

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
  <div
    class="fixed inset-0 flex items-center justify-center bg-black/50"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg rounded-md bg-white p-4">
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

            <div v-if="customBasis === 'weekly'" class="flex gap-1">
              <button
                v-for="(label, day) in weekdayLabels"
                :key="day"
                type="button"
                class="h-8 w-8 cursor-pointer rounded-full border text-xs"
                :class="
                  customWeekdays.includes(day)
                    ? 'border-blue-400 bg-blue-100 font-medium text-blue-700'
                    : 'border-gray-200 text-gray-500'
                "
                @click="toggleWeekday(day)"
              >
                {{ label }}
              </button>
            </div>

            <div v-else class="grid grid-cols-7 gap-1">
              <button
                v-for="day in 31"
                :key="day"
                type="button"
                class="h-8 w-8 cursor-pointer rounded-md border text-xs"
                :class="
                  customMonthDays.includes(day)
                    ? 'border-blue-400 bg-blue-100 font-medium text-blue-700'
                    : 'border-gray-200 text-gray-500'
                "
                @click="toggleMonthDay(day)"
              >
                {{ day }}
              </button>
            </div>
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
    </div>
  </div>

  <ErrorModal
    v-if="showErrorModal"
    :message="errorMessage"
    @close="showErrorModal = false"
  />
</template>
