<template>
  <div class="space-y-3 rounded-md border border-blue-100 bg-white p-3">
    <label class="block text-sm font-medium text-gray-700">
      반복
      <select v-model="preset" class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2" @change="applyPreset">
        <option value="none">반복 안 함</option>
        <option value="daily">매일</option>
        <option value="weekdays">평일마다</option>
        <option value="weekly">매주 같은 요일</option>
        <option value="biweekly">2주마다 같은 요일</option>
        <option value="monthly">매월 같은 날짜</option>
        <option value="monthlyWeekday">매월 같은 순번의 요일</option>
        <option value="yearly">매년 같은 날짜</option>
        <option value="custom">사용자 지정</option>
      </select>
    </label>

    <div v-if="preset === 'custom' && rule" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label class="text-sm font-medium text-gray-700">반복 간격
        <div class="mt-1 flex gap-2">
          <input v-model.number="rule.interval" min="1" type="number" class="w-20 rounded-md border border-gray-300 px-3 py-2" @change="emitRule" />
          <select v-model="rule.frequency" class="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2" @change="emitRule">
            <option value="DAILY">일</option><option value="WEEKLY">주</option><option value="MONTHLY">개월</option><option value="YEARLY">년</option>
          </select>
        </div>
      </label>
      <label class="text-sm font-medium text-gray-700">종료
        <select v-model="rule.end_type" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule">
          <option value="NEVER">종료 없음</option><option value="ON_DATE">날짜 지정</option><option value="AFTER_COUNT">횟수 지정</option>
        </select>
      </label>
      <label v-if="rule.end_type === 'ON_DATE'" class="text-sm font-medium text-gray-700 sm:col-span-2">종료 날짜
        <input v-model="rule.end_date" :min="startDate" type="date" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule" />
      </label>
      <label v-if="rule.end_type === 'AFTER_COUNT'" class="text-sm font-medium text-gray-700 sm:col-span-2">생성 횟수
        <input v-model.number="rule.max_occurrences" min="1" type="number" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule" />
      </label>
      <div v-if="rule.frequency === 'WEEKLY'" class="sm:col-span-2">
        <p class="text-sm font-medium text-gray-700">요일</p>
        <div class="mt-1 flex flex-wrap gap-2">
          <button v-for="(label, day) in WEEKDAYS" :key="label" type="button" class="h-9 w-9 rounded-full text-sm" :class="rule.weekdays.includes(day) ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700'" @click="toggleWeekday(day)">{{ label }}</button>
        </div>
      </div>
      <template v-if="rule.frequency === 'MONTHLY'">
        <label class="text-sm font-medium text-gray-700">월 반복 방식
          <select v-model="rule.monthly_mode" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule"><option value="DAY_OF_MONTH">같은 날짜</option><option value="NTH_WEEKDAY">같은 순번 요일</option></select>
        </label>
        <label v-if="rule.monthly_mode === 'DAY_OF_MONTH'" class="text-sm font-medium text-gray-700">날짜
          <input v-model.number="rule.day_of_month" min="1" max="31" type="number" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule" />
        </label>
        <template v-else>
          <label class="text-sm font-medium text-gray-700">순번
            <select v-model.number="rule.week_ordinal" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule"><option :value="1">첫 번째</option><option :value="2">두 번째</option><option :value="3">세 번째</option><option :value="4">네 번째</option><option :value="5">마지막</option></select>
          </label>
          <label class="text-sm font-medium text-gray-700">요일
            <select v-model.number="rule.weekday" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @change="emitRule"><option v-for="(label, day) in WEEKDAYS" :key="label" :value="day">{{ label }}요일</option></select>
          </label>
        </template>
      </template>
    </div>
    <p v-if="rule" class="text-xs text-gray-600">{{ recurrenceLabel(rule) }}</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { createRecurrence, recurrenceLabel, recurrencePresets, WEEKDAYS } from '@/utils/paymentRecurrence';

const props = defineProps({ modelValue: { type: Object, default: null }, startDate: { type: String, default: '' } });
const emit = defineEmits(['update:modelValue']);
const preset = ref(props.modelValue ? 'custom' : 'none');
const rule = ref(props.modelValue ? { ...props.modelValue } : null);

watch(() => props.startDate, () => { if (preset.value !== 'custom') applyPreset(); });
watch(() => props.modelValue, value => { if (!value) { preset.value = 'none'; rule.value = null; } });

const applyPreset = () => {
  if (preset.value === 'none') { rule.value = null; emit('update:modelValue', null); return; }
  rule.value = preset.value === 'custom' ? createRecurrence(props.startDate) : recurrencePresets(props.startDate)[preset.value];
  emitRule();
};
const emitRule = () => emit('update:modelValue', rule.value ? { ...rule.value, weekdays: [...rule.value.weekdays] } : null);
const toggleWeekday = day => {
  rule.value.weekdays = rule.value.weekdays.includes(day) ? rule.value.weekdays.filter(value => value !== day) : [...rule.value.weekdays, day].sort();
  emitRule();
};
</script>
