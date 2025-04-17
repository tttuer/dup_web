<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

const toast = useToast();

const router = useRouter();

const username = ref('');
const password = ref('');

async function login() {
  const form = new URLSearchParams();
  form.append('grant_type', 'password');
  form.append('username', username.value);
  form.append('password', password.value);

  if (!username.value || !password.value) {
    toast.error('아이디와 비밀번호를 입력해주세요.');
    return;
  }

  const response = await fetch('http://localhost:8080/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const data = await response.json();

  if (response.ok) {
    localStorage.setItem('access_token', data.access_token);
    router.push('/');
    return;
  }

  toast.error('아이디와 비밀번호를 확인해주세요.');
}
</script>

<template>
  <main class="flex h-full w-full items-center justify-center p-8">
    <div class="box-border h-80 w-96 rounded-lg border-2 border-gray-300 p-4">
      <h2 class="text-center font-sans text-2xl">아카이브 로그인</h2>
      <div class="mt-8 mr-2 h-12 w-full rounded-lg border-1 border-gray-300">
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
      <div class="mt-6 mr-2 h-12 w-full rounded-lg border-1 border-gray-300">
        <input
          v-model="password"
          class="h-full w-full pl-4"
          type="password"
          id="password"
          name="password"
          placeholder="비밀번호"
          @keydown.enter="login"
          required
        />
      </div>
      <div class="mt-8 mr-2 h-12 w-full font-sans text-white">
        <input
          class="h-full w-full rounded-xl border-1 border-gray-300 bg-black hover:outline-2 focus:outline-offset-2 focus:outline-black"
          type="submit"
          value="로그인"
          @click="login"
        />
      </div>
    </div>
  </main>
</template>
