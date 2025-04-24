<!-- components/LockToggle.vue -->
<template>
    <div v-show="role === 'ADMIN'" class="flex h-6 w-6 items-center justify-center">
      <input id="lock" v-show="false" type="checkbox" v-model="modelValue" />
      <label
        for="lock"
        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-300 hover:bg-gray-200"
      >
        <svg
          v-if="modelValue"
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 text-gray-800"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-3 0H9V9a3 3 0 1 1 6 0v2z"
          />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-3"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      </label>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  
  defineProps({
    modelValue: Boolean,
    role: String,
  });
  
  defineEmits(['update:modelValue']);
  </script>
  