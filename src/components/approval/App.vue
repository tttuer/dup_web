<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl font-semibold text-gray-900">전자결재</h1>
            
            <!-- 탭 메뉴 -->
            <nav class="flex space-x-8">
              <button
                @click="activeTab = 'my-requests'"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'my-requests' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                내 결재함
              </button>
              <button
                @click="activeTab = 'pending'"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'pending' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                결재 대기
                <span v-if="pendingCount > 0" class="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {{ pendingCount }}
                </span>
              </button>
              <button
                @click="activeTab = 'completed'"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'completed' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                결재 완료
              </button>
              <button
                @click="activeTab = 'search-all'"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'search-all' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                전체 목록
              </button>
              <button
                @click="activeTab = 'favorites'"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'favorites' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                즐겨찾기
              </button>
              <button
                @click="activeTab = 'templates'"
                v-if="userStore.isAdmin"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'templates' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                ]"
              >
                양식 관리
              </button>
            </nav>
          </div>
          
          <div class="flex items-center space-x-4">
            <!-- 아카이브 이동 버튼 -->
            <div class="flex items-center border-r border-gray-200 pr-4">
              <button
                @click="goToArchive"
                class="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <Archive class="w-4 h-4 mr-1" />
                아카이브
              </button>
            </div>
            
            <!-- 새 결재 요청 버튼 -->
            <button
              @click="showCreateModal = true"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <Plus class="w-4 h-4 mr-2" />
              새 결재
            </button>
            
            <!-- 로그아웃 버튼 -->
            <button
              @click="logout"
              class="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="로그아웃"
            >
              <LogOut class="w-4 h-4 mr-1" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 내 결재함 -->
      <div v-if="activeTab === 'my-requests'">
        <MyApprovalList />
      </div>

      <!-- 결재 대기 -->
      <div v-if="activeTab === 'pending'">
        <PendingApprovalList />
      </div>

      <!-- 결재 완료 -->
      <div v-if="activeTab === 'completed'">
        <CompletedApprovalList @view-detail="handleViewDetail" />
      </div>

      <!-- 전체 검색 -->
      <div v-if="activeTab === 'search-all'">
        <AllApprovalSearch @view-detail="handleViewDetail" />
      </div>

      <!-- 즐겨찾기 관리 -->
      <div v-if="activeTab === 'favorites'">
        <FavoriteGroupManagement />
      </div>

      <!-- 양식 관리 (관리자만) -->
      <div v-if="activeTab === 'templates' && userStore.isAdmin">
        <TemplateManagement />
      </div>
    </main>

    <!-- 새 결재 요청 모달 -->
    <ApprovalCreateModal
      :is-visible="showCreateModal"
      @close="showCreateModal = false"
      @created="handleRequestCreated"
    />

    <!-- 결재 상세보기 모달 -->
    <ApprovalDetailModal
      :is-visible="showDetailModal"
      :request-id="selectedApproval?.id"
      @close="showDetailModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Archive, LogOut } from 'lucide-vue-next';
import { useUserStore } from '@/stores/useUserStore';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { authFetch } from '@/utils/authFetch';
import ApprovalCreateModal from './ApprovalCreateModal.vue';
import ApprovalDetailModal from './ApprovalDetailModal.vue';
import MyApprovalList from './MyApprovalList.vue';
import PendingApprovalList from './PendingApprovalList.vue';
import CompletedApprovalList from './CompletedApprovalList.vue';
import AllApprovalSearch from './AllApprovalSearch.vue';
import TemplateManagement from './TemplateManagement.vue';
import FavoriteGroupManagement from './FavoriteGroupManagement.vue';

const router = useRouter();
const userStore = useUserStore();
const approvalStore = useApprovalStore();

// 상태 관리
const activeTab = ref('my-requests');
const showCreateModal = ref(false);
const showDetailModal = ref(false);
const selectedApproval = ref(null);

// 권한 체크
const hasVoucherAccess = computed(() => {
  const user = userStore.currentUser;
  return user && user.roles && (user.roles.includes('VOUCHER') || user.roles.includes('ADMIN'));
});

// 아카이브로 이동
const goToArchive = () => {
  // VOUCHER 권한이 있으면 전표 페이지로, 없으면 파일 페이지로
  if (hasVoucherAccess.value) {
    router.push('/');
  } else {
    router.push('/extra');
  }
};

// 로그아웃
const logout = async () => {
  try {
    // 서버에 refresh_token 쿠키 삭제 요청
    const userUrl = import.meta.env.VITE_USER_API_URL;
    await authFetch(`${userUrl}/logout`, {
      method: 'POST',
      withCredentials: true,
    });
  } catch (err) {
    console.error('로그아웃 요청 실패:', err);
  }

  // 클라이언트 토큰 제거 및 로그인 페이지로 이동
  localStorage.removeItem('access_token');
  router.push('/login');
};

// 상세보기 핸들러
const handleViewDetail = (approval) => {
  selectedApproval.value = approval;
  showDetailModal.value = true;
};

// 결재 대기 개수
const pendingCount = computed(() => {
  return approvalStore.pendingApprovals.length;
});

// 초기 데이터 로드
onMounted(async () => {
  try {
    // await userStore.fetchCurrentUser();
    await approvalStore.fetchMyApprovalRequests();
    await approvalStore.fetchPendingApprovals();
  } catch (error) {
    console.error('초기 데이터 로드 오류:', error);
  }
});

// 새 결재 요청 생성 완료 핸들러
const handleRequestCreated = () => {
  approvalStore.fetchMyApprovalRequests();
  activeTab.value = 'my-requests';
};
</script>