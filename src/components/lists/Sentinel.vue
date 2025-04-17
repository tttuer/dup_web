<!-- components/Sentinel.vue -->
<template>
  <tr ref="sentinel">
    <td colspan="5" class="px-4 py-4 text-center">
      <slot>
        <!-- 기본 로딩 표시 -->
        <svg
          class="size-6 animate-spin text-gray-500"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-300">불러오는 중...</p>
      </slot>
    </td>
  </tr>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  onIntersect: {
    type: Function,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({ root: null, threshold: 0.1 }),
  },
});

const sentinel = ref(null);
let observer = null;

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        props.onIntersect();
      }
    });
  }, props.options);

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
});

onBeforeUnmount(() => {
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value);
  }
  if (observer) {
    observer.disconnect();
  }
  observer = null;
});
</script>
