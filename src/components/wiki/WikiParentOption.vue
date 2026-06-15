<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition"
    :class="selected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50'"
    @click="$emit('select')"
  >
    <Folder class="h-4 w-4 shrink-0" :class="selected ? 'text-blue-500' : 'text-gray-400'" />
    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold text-gray-800">{{ title }}</span>
      <span class="mt-0.5 block truncate text-xs text-gray-500">{{ path }}</span>
    </span>
    <Check v-if="selected" class="h-4 w-4 shrink-0 text-blue-600" />
  </button>
</template>

<script setup>
import { Check, Folder } from 'lucide-vue-next';

defineProps({
  selected: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
});

defineEmits(['select']);
</script>
