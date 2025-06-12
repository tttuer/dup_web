<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  buttonText: String,
});

const userUrl = `${import.meta.env.VITE_USER_API_URL}`;

const buttonText = ref('로그인');

const accessToken = localStorage.getItem('access_token');

if (accessToken) {
  buttonText.value = '로그아웃';
}

async function logout() {
  try {
    // ✅ 1. 서버에 refresh_token 쿠키 삭제 요청
    await axios.post(`${userUrl}/logout`, {}, {
      withCredentials: true  // 쿠키 전송을 위해 꼭 필요
    });
  } catch (err) {
    console.error('로그아웃 요청 실패:', err);
  }

  // ✅ 2. 클라이언트 토큰 제거 및 UI 업데이트
  localStorage.removeItem('access_token');
  buttonText.value = '로그인';
  router.push('/login');
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
