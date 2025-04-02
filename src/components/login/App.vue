<script setup>
import Header from "../Header.vue";
import Login from "./Login.vue";
import Footer from "../Footer.vue";
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />
    <hr class="my-1 text-gray-300" />
    <div class="flex-1 overflow-hidden">
      <Login />
    </div>
    <hr class="my-1 text-gray-300" />
    <Footer />
  </div>
</template>

<style scoped></style>
