<script setup>
import Main from '@/components/shared/Main.vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const props = defineProps({
  ListComponent: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />
    <Main :ListComponent="ListComponent" />
    <Footer />
  </div>
</template>

<style scoped></style>
