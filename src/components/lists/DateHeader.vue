<script setup>
import flatpickr from "flatpickr";
import {ref, onMounted} from "vue";


const datepickerInput = ref(null);
let fpInstance = null;

onMounted(() => {
  fpInstance = flatpickr(datepickerInput.value, {
    locale: flatpickr.l10ns.ko,
    onChange: (selectedDates, dateStr) => {
      console.log("선택된 날짜:", dateStr);
      // emit or call parent filter logic here
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