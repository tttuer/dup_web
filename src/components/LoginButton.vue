<script setup>
import { ref, defineProps } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const props = defineProps({
  buttonText: String,
});

const buttonText = ref("로그인");

const accessToken = localStorage.getItem("access_token");

if (accessToken) {
  buttonText.value = "로그아웃";
}

function logout() {
  localStorage.removeItem("access_token");
  buttonText.value = "로그인";
  router.push("/login");
}
</script>

<template>
  <div class="col-span-1 flex items-center justify-end pr-8 text-center">
    <router-link
      @click="logout"
      to="/login"
      class="rounded-md border border-gray-300 px-4 py-2 font-sans text-sm font-semibold text-gray-700 hover:bg-black hover:text-white dark:bg-black dark:text-white"
    >
      {{ buttonText }}
    </router-link>
  </div>
</template>

<style scoped></style>
