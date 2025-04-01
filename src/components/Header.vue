<script setup>

import LoginButton from "./LoginButton.vue";
</script>

<template>
  <header>
    <div class="grid h-20 grid-cols-6 grid-rows-1 content-center gap-6">
        <div class="col-span-1 content-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-archive ml-6 shrink-0"
          >
            <rect width="20" height="5" x="2" y="3" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
          </svg>
        </div>
        <div class="col-span-4 content-center justify-items-center text-center">
          <h1 class="font-sans text-xl font-semibold">
            전표 증빙자료 아카이브
          </h1>
        </div>

        <LoginButton />
      </div>
  </header>
</template>

<style scoped></style>
