<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown } from '@lucide/vue';

const emit = defineEmits<{
  change: [filter: Record<string, string>];
}>();

const status = ref('');
const priority = ref('');
const dueDateMin = ref('');
const dueDateMax = ref('');
const showPriorityFilter = ref(false);

function emitChange() {
  emit('change', {
    status: status.value,
    priority: priority.value,
    dueDateMin: dueDateMin.value,
    dueDateMax: dueDateMax.value,
  });
}

function setStatus(value: string) {
  status.value = value;
  emitChange();
}

function setPriority(value: string) {
  priority.value = value;
  emitChange();
}

function setDueDateMin(value: string) {
  dueDateMin.value = value;
  emitChange();
}

function setDueDateMax(value: string) {
  dueDateMax.value = value;
  emitChange();
}
</script>

<template>
  <div class="flex items-center gap-3 px-4 items-start">
    <div class="flex flex-1 flex-wrap items-center gap-2">
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          status === ''
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setStatus('')"
      >
        All
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          status === 'not_started'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setStatus('not_started')"
      >
        Not started
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          status === 'in_progress'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setStatus('in_progress')"
      >
        In progress
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          status === 'archived'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setStatus('archived')"
      >
        Archived
      </button>
      <button
        class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
        :class="
          status === 'completed'
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        "
        @click="setStatus('completed')"
      >
        Completed
      </button>
      <button
        type="button"
        class="flex items-center gap-1 px-2 py-1.5 text-sm whitespace-nowrap text-gray-500 hover:text-gray-900"
        @click="showPriorityFilter = !showPriorityFilter"
      >
        More filters
        <ChevronDown class="h-4 w-4 transition-transform" :class="showPriorityFilter ? 'rotate-180' : ''" />
      </button>
    </div>
    <slot />
  </div>

  <div v-if="showPriorityFilter" class="flex items-center gap-2 px-4">
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        priority === ''
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setPriority('')"
    >
      No priority
    </button>
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        priority === 'low'
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setPriority('low')"
    >
      Low
    </button>
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        priority === 'medium'
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setPriority('medium')"
    >
      Medium
    </button>
    <button
      class="rounded-full border px-3 py-1.5 text-sm whitespace-nowrap"
      :class="
        priority === 'high'
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 text-gray-600 hover:bg-gray-100'
      "
      @click="setPriority('high')"
    >
      High
    </button>
  </div>

  <div v-if="showPriorityFilter" class="flex items-center gap-2 px-4 mt-1">
    <label class="flex items-center gap-2 text-sm text-gray-600">
      Due from
      <input
        type="date"
        class="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        :value="dueDateMin"
        @change="setDueDateMin(($event.target as HTMLInputElement).value)"
      />
    </label>
    <label class="flex items-center gap-2 text-sm text-gray-600">
      to
      <input
        type="date"
        class="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        :value="dueDateMax"
        @change="setDueDateMax(($event.target as HTMLInputElement).value)"
      />
    </label>
  </div>
</template>
