<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import Header from '../Header.vue';
import Footer from '../Footer.vue';

const toast = useToast();
const router = useRouter();

const name = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');

const userApiUrl = `${import.meta.env.VITE_USER_API_URL}`;

async function signUp() {
  if (!name.value || !username.value || !password.value || !confirmPassword.value) {
    toast.error('모든 필드를 입력해주세요.');
    return;
  }

  if (password.value !== confirmPassword.value) {
    toast.error('비밀번호가 일치하지 않습니다.');
    return;
  }

  if (password.value.length < 6) {
    toast.error('비밀번호는 6자 이상이어야 합니다.');
    return;
  }

  try {
    const response = await fetch(`${userApiUrl}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.value,
        user_id: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success('회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
      router.push('/login');
      return;
    }

    if (response.status === 409) {
      toast.error('이미 사용 중인 아이디입니다.');
      return;
    }

    toast.error(data.message || '회원가입에 실패했습니다.');
  } catch (error) {
    console.error('회원가입 오류:', error);
    toast.error('서버 오류가 발생했습니다.');
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="flex h-screen flex-col">
    <Header />
    <main class="flex w-full flex-1 items-center justify-center p-8">
      <div class="box-border h-auto w-96 rounded-lg border-2 border-gray-300 p-4">
        <h2 class="text-center font-sans text-2xl">회원가입</h2>

        <div class="mt-6 mr-2 h-12 w-full rounded-lg border-1 border-gray-300">
          <input
            v-model="name"
            class="h-full w-full pl-4"
            type="text"
            id="name"
            name="name"
            placeholder="이름"
            required
          />
        </div>

        <div class="mt-4 mr-2 h-12 w-full rounded-lg border-1 border-gray-300">
          <input
            v-model="username"
            class="h-full w-full pl-4"
            type="text"
            id="username"
            name="username"
            placeholder="아이디"
            required
          />
        </div>

        <div class="mt-4 mr-2 h-12 w-full rounded-lg border-1 border-gray-300">
          <input
            v-model="password"
            class="h-full w-full pl-4"
            type="password"
            id="password"
            name="password"
            placeholder="비밀번호 (6자 이상)"
            required
          />
        </div>

        <div class="mt-4 mr-2 h-12 w-full rounded-lg border-1 border-gray-300">
          <input
            v-model="confirmPassword"
            class="h-full w-full pl-4"
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            @keydown.enter="signUp"
            required
          />
        </div>

        <div class="mt-6 mr-2 h-12 w-full font-sans text-white">
          <input
            class="h-full w-full rounded-xl border-1 border-gray-300 bg-black hover:outline-2 focus:outline-offset-2 focus:outline-black"
            type="submit"
            value="회원가입"
            @click="signUp"
          />
        </div>

        <div class="mt-4 text-center">
          <button @click="goToLogin" class="text-blue-600 underline hover:text-blue-800">
            로그인하기
          </button>
        </div>
      </div>
    </main>
    <Footer />
  </div>
</template>
