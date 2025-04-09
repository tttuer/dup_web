<script setup>
import Flatpickr from "vue-flatpickr-component";
</script>

<template>
  <div>
    <div>
      <Flatpickr
        class="w-20 h-9 rounded-sm border border-gray-300"
        v-model="date"
        :config="config"
        placeholder="20250409"
      />
    </div>
    -
    <div>
        <Flatpickr
        class="w-20 h-9 rounded-sm border border-gray-300"
        v-model="date"
        :config="config"
        placeholder="끝"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
