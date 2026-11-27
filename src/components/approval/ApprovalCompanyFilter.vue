<template>
  <fieldset :disabled="disabled" class="mb-4 flex flex-wrap gap-2">
    <legend class="mb-2 text-sm font-medium text-gray-700">회사</legend>
    <button
      v-for="{ code, label } in options"
      :key="code"
      type="button"
      :aria-pressed="model === code"
      class="rounded-md border px-3 py-1.5 text-sm disabled:opacity-60"
      :class="model === code ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'"
      @click="selectCompany(code)"
    >
      {{ label }}
    </button>
  </fieldset>
</template>

<script setup>
import { companyNameToEnum, companyOptions } from '@/constants/companies';

defineProps({ disabled: Boolean });
const model = defineModel({ type: String, required: true });
const emit = defineEmits(['change']);
const options = [
  { code: '', label: '전체' },
  ...companyOptions.map(label => ({ code: companyNameToEnum[label], label })),
];

function selectCompany(code) {
  if (model.value === code) return;
  model.value = code;
  emit('change');
}
</script>
