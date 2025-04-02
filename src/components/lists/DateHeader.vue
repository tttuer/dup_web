<script setup>
import flatpickr from "flatpickr";
import {ref, onMounted} from "vue";

const emit = defineEmits(['select'])

const datepickerInput = ref(null);
let fpInstance = null;

function formatDate(dateStr) {
  // 입력값이 "2025-03-20" 형식일 경우 처리
  const year = dateStr.substring(0, 4); // "2025"
  const month = dateStr.substring(5, 7); // "03"
  const day = dateStr.substring(8, 10); // "20"

  // YYYYMMDD 형식으로 반환
  return `${year}${month}${day}`;
}

onMounted(() => {
  fpInstance = flatpickr(datepickerInput.value, {
    onChange: (selectedDates, dateStr) => {
      // emit or call parent filter logic here
      emit('select', formatDate(dateStr));
    },
  });
});

const openDatePicker = () => {
  if (fpInstance) {
    fpInstance.open();
  }
};

</script>

<template>
  <th
      class="w-45 text-left px-4 py-2 cursor-pointer select-none group hover:bg-blue-50 transition"
      @click="openDatePicker"
  >
    날짜
    <span class="ml-1 text-sm text-gray-400 group-hover:text-blue-500">📅</span>
    <input
        ref="datepickerInput"
        type="text"
        class="absolute opacity-0 pointer-events-none w-0 h-0"
    />
  </th>
</template>

<style scoped>

</style>