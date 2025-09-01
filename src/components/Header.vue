<script setup>
import { onMounted, onUnmounted, ref, watchEffect } from 'vue';
import LoginButton from './LoginButton.vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { useTypeStore, TYPE } from '@/stores/useTypeStore';
import { usePendingUsersStore } from '@/stores/usePendingUsersStore';
import { useApprovalNotificationStore } from '@/stores/useApprovalNotificationStore';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const route = useRoute();
const typeStore = useTypeStore();
const pendingUsersStore = usePendingUsersStore();
const approvalNotificationStore = useApprovalNotificationStore();
const approvalStore = useApprovalStore();

const hasVoucherRole = ref(false);
const hasAdminRole = ref(false);

// 스토어에서 pendingUsersCount 가져오기
const { pendingUsersCount } = pendingUsersStore;

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const roles = decoded.roles || [];
      hasVoucherRole.value = roles.includes('VOUCHER') || roles.includes('ADMIN');
      hasAdminRole.value = roles.includes('ADMIN');
    } catch (e) {
      console.error('토큰 디코딩 실패:', e);
    }
  }
}

// 컴포넌트 마운트 시 웹소켓 연결 및 초기 데이터 로드
onMounted(() => {
  pendingUsersStore.connectWebSocket();
  approvalNotificationStore.connectWebSocket();
  
  // 웹소켓 연결 확인 후 카운트 새로고침
  const checkAndRefresh = () => {
    if (approvalNotificationStore.isConnected) {
      approvalNotificationStore.refreshPendingCount();
    } else {
      // 연결이 안되었다면 잠시 후 다시 시도
      setTimeout(checkAndRefresh, 500);
    }
  };
  
  // 초기 연결 확인 시작 (1초 후)
  setTimeout(checkAndRefresh, 1000);
});

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

function goToApproval() {
  router.push('/approval');
}

watchEffect(() => {
  if (route.path === '/') {
    typeStore.setType(TYPE.VOUCHER);
  } else if (route.path === '/extra') {
    typeStore.setType(TYPE.EXTRA);
    
    // 아카이브 페이지 진입 시 결재 데이터 로드
    setTimeout(async () => {
      // approvalStore에서 결재 대기 데이터 로드
      try {
        await approvalStore.fetchPendingApprovals();
      } catch (error) {
        console.error('결재 데이터 로드 실패:', error);
      }
      
      // 웹소켓도 새로고침
      if (approvalNotificationStore.isConnected) {
        approvalNotificationStore.refreshPendingCount();
      }
    }, 300);
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
            :class="route.path === '/approval' ? 'border-b-2 border-black font-bold' : ''"
          >
            <input
              class="cursor-pointer rounded-lg p-1 hover:bg-gray-200/75"
              type="button"
              value="전자결재"
              @click="goToApproval"
            />
            <span
              v-if="approvalNotificationStore.pendingApprovalCount > 0"
              class="absolute top-1.5 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
            >
              {{ approvalNotificationStore.pendingApprovalCount }}
            </span>
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
