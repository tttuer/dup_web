<script setup>
import Main from "./Main.vue";
import Header from "../Header.vue";
import Footer from "../Footer.vue";
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />
    <div>
      <hr class="my-1 text-gray-300" />
    </div>

    <div class="flex-1 h-full">
      <Main />
    </div>
    <div>
      <hr class="my-1 text-gray-300" />
    </div>
    <Footer />
  </div>
</template>

<style scoped></style>
