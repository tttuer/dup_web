<script setup>
import Flatpickr from "vue-flatpickr-component";
import { ref, watch } from "vue";

const config = {
  dateFormat: "Ymd",
};

const emit = defineEmits(["search"]);

const start_at = ref("");
const end_at = ref("");

watch([start_at, end_at], () => {
  emit("search", { start_at: start_at.value, end_at: end_at.value });
});
</script>

<template>
  <div class="flex flex-row">
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
