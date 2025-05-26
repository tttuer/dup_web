<script setup>
import { ref, watchEffect } from 'vue';
import LoginButton from './LoginButton.vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { useTypeStore, TYPE } from '@/stores/typeStore';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const route = useRoute();
const typeStore = useTypeStore();
const hasVoucherRole = ref(false);

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const roles = decoded.roles || [];
      hasVoucherRole.value = roles.includes('VOUCHER');
    } catch (e) {
      console.error('토큰 디코딩 실패:', e);
    }
  }
}

function goToVoucher() {
  typeStore.setType(TYPE.VOUCHER);
  router.push('/');
}

function goToExtra() {
  typeStore.setType(TYPE.EXTRA);
  router.push('/extra');
}

watchEffect(() => {
  if (route.path === '/') {
    typeStore.setType(TYPE.VOUCHER);
  } else if (route.path === '/extra') {
    typeStore.setType(TYPE.EXTRA);
  } else {
    typeStore.setType('');
  }
});
</script>

<template>
  <header class="border-b border-gray-300">
    <div class="grid h-18 grid-cols-6 grid-rows-1 content-center gap-6">
      <div class="col-span-1 flex content-center pl-1">
        <div class="content-center">
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
        <div class="ml-4 content-center">
          <h1 class="font-sans text-xl font-semibold">아카이브</h1>
        </div>
      </div>
      <div class="col-span-4 content-center">
        <div class="flex h-full content-center" v-show="route.path !== '/login'">
          <div
            class="content-center"
            v-if="hasVoucherRole"
            :class="
              typeStore.currentType == TYPE.VOUCHER ? 'border-b-2 border-black font-bold' : ''
            "
          >
            <input
              class="cursor-pointer rounded-lg p-1 hover:bg-gray-200/75"
              type="button"
              value="전표 증빙자료"
              @click="goToVoucher"
            />
          </div>
          <div
            class="ml-5 content-center"
            :class="typeStore.currentType == TYPE.EXTRA ? 'border-b-2 border-black font-bold' : ''"
          >
            <input
              class="cursor-pointer rounded-lg p-1 hover:bg-gray-200/75"
              type="button"
              value="업무 파일"
              @click="goToExtra"
            />
          </div>
        </div>
      </div>
      <LoginButton />
    </div>
  </header>
</template>

<style scoped></style>
