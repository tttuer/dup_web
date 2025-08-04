<script setup>
import { ref, watchEffect } from 'vue';
import LoginButton from './LoginButton.vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { useTypeStore, TYPE } from '@/stores/useTypeStore';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const route = useRoute();
const typeStore = useTypeStore();
const hasVoucherRole = ref(false);
const hasAdminRole = ref(false);
const pendingUsersCount = ref(0);

let pendingUsersSocket = null;

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const roles = decoded.roles || [];
      hasVoucherRole.value = roles.includes('VOUCHER') || roles.includes('ADMIN');
      hasAdminRole.value = roles.includes('ADMIN');
      
      // 관리자인 경우 웹소켓 연결
      if (hasAdminRole.value) {
        connectPendingUsersWebSocket();
      }
    } catch (e) {
      console.error('토큰 디코딩 실패:', e);
    }
  }
}

function connectPendingUsersWebSocket() {
  const token = localStorage.getItem('access_token');
  const wsUrl = `${import.meta.env.VITE_WS_URL_PENDING_USERS}?token=${token}`;
  
  pendingUsersSocket = new WebSocket(wsUrl);
  
  pendingUsersSocket.onopen = () => {
  };
  
  pendingUsersSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.pending_users_count !== undefined) {
        pendingUsersCount.value = data.pending_users_count;
      }
    } catch (error) {
      console.error('웹소켓 메시지 파싱 오류:', error);
    }
  };
  
  pendingUsersSocket.onerror = (error) => {
    console.error('📡 Pending users WebSocket error:', error);
  };
  
  pendingUsersSocket.onclose = () => {
    console.log('📡 Pending users WebSocket disconnected');
  };
}

// 컴포넌트 언마운트 시 웹소켓 정리
function cleanup() {
  if (pendingUsersSocket && pendingUsersSocket.readyState === WebSocket.OPEN) {
    pendingUsersSocket.close();
  }
}

function goToVoucher() {
  typeStore.setType(TYPE.VOUCHER);
    router.push('/')
    .then(() => {
      // 성공적으로 라우팅된 후 추가 작업이 필요하면 여기에 작성
    })
    .catch(err => console.error('⛔️ router.push 에러:', err));
}

function goToExtra() {
  typeStore.setType(TYPE.EXTRA);
  router.push('/extra');
}

function goToUserApproval() {
  router.push('/user-approval');
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
    <div class="grid h-18 grid-cols-4 grid-rows-1 content-center gap-6">
      <div class="col-span-1 flex content-center pl-1 w-full">
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
        <div class="ml-4 content-center w-full">
          <h1 class="font-sans text-xl font-semibold w-full">아카이브</h1>
        </div>
      </div>
      <div class="col-span-2 content-center">
        <div class="flex h-full content-center" v-show="route.path !== '/login' && route.path !== '/signup'">
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
          <div
            class="ml-5 content-center relative"
            v-if="hasAdminRole"
            :class="route.path === '/user-approval' ? 'border-b-2 border-black font-bold' : ''"
          >
            <input
              class="cursor-pointer rounded-lg p-1 hover:bg-gray-200/75"
              type="button"
              value="회원 승인"
              @click="goToUserApproval"
            />
            <span
              v-if="pendingUsersCount > 0"
              class="absolute top-1.5 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
            >
              {{ pendingUsersCount }}
            </span>
          </div>
        </div>
      </div>
      <LoginButton />
    </div>
  </header>
</template>

<style scoped></style>
