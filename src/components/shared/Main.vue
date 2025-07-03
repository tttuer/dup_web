<script setup>
const props = defineProps({
  ListComponent: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <main class="flex flex-col grow overflow-hidden">
    <component :is="ListComponent" />
  </main>
</template>

<style scoped></style>
