<script setup>
import Flatpickr from 'vue-flatpickr-component';
import { ref, watch } from 'vue';

const config = {
  dateFormat: 'Ymd',
};

const emit = defineEmits(['search']);
const props = defineProps({
  startAt: {
    type: String,
    default: '',
  },
  endAt: {
    type: String,
    default: '',
  },
});

const start_at = ref(props.startAt);
const end_at = ref(props.endAt);

watch(
  () => [props.startAt, props.endAt],
  ([startAt, endAt]) => {
    start_at.value = startAt;
    end_at.value = endAt;
  },
);

watch([start_at, end_at], () => {
  emit('search', { start_at: start_at.value, end_at: end_at.value });
});
</script>

<template>
  <div class="flex shrink-0 flex-row">
    <div>
      <Flatpickr
        class="h-9 w-24 rounded-sm border border-gray-300 pl-2"
        v-model="start_at"
        :config="config"
        placeholder="20250409"
      />
    </div>
    <p class="mx-2 h-9 content-center">-</p>
    <div>
      <Flatpickr
        class="h-9 w-24 rounded-sm border border-gray-300 pl-2"
        v-model="end_at"
        :config="config"
        placeholder="20250409"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
