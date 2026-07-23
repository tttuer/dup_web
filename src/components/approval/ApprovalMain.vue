<template>
  <div class="flex h-full w-full bg-white">
    <!-- 사이드바 -->
    <div class="w-64 border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
      <div class="p-4 border-b border-gray-200">
        <button
          @click="goToCreateApproval"
          class="w-full flex justify-center items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <Plus class="w-4 h-4 mr-2" />
          새 결재
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto p-4 space-y-2">
        <button
          @click="activeTab = 'my-requests'"
          :class="[
            'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'my-requests' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          기안함
        </button>
        <button
          @click="activeTab = 'pending'"
          :class="[
            'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'pending' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          <span>결재 대기</span>
          <span v-if="pendingCount > 0" class="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {{ pendingCount }}
          </span>
        </button>
        <button
          @click="activeTab = 'completed'"
          :class="[
            'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'completed' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          결재함
        </button>
        <button
          @click="activeTab = 'payment-tasks'"
          :class="[
            'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'payment-tasks'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          <span>납부 업무</span>
          <span v-if="paymentTaskSummary.today_count > 0" class="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
            오늘 {{ paymentTaskSummary.today_count }}
          </span>
          <span v-else-if="paymentTaskSummary.confirmation_count > 0" class="ml-1 rounded-full bg-indigo-500 px-2 py-0.5 text-xs text-white">
            확인 {{ paymentTaskSummary.confirmation_count }}
          </span>
        </button>
        <button
          @click="activeTab = 'search-all'"
          v-if="userStore.isAdmin"
          :class="[
            'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'search-all' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          전체 목록
        </button>
        <button
          @click="activeTab = 'favorites'"
          :class="[
            'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'favorites' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          결재선 그룹
        </button>
        <button
          @click="activeTab = 'templates'"
          v-if="userStore.isAdmin"
          :class="[
            'w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left',
            activeTab === 'templates' 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
        >
          양식 관리
        </button>
      </nav>
    </div>

    <!-- 메인 콘텐츠 영역 -->
    <div class="flex-1 overflow-y-auto bg-gray-50 relative p-8">
      <div class="max-w-6xl mx-auto">
        <!-- 내 결재함 -->
        <div v-if="activeTab === 'my-requests'">
          <MyApprovalList @create-request="activeTab = 'create'" @edit-request="handleEditRequest" />
        </div>

        <!-- 결재 대기 -->
        <div v-if="activeTab === 'pending'">
          <PendingApprovalList />
        </div>

        <!-- 결재 완료 -->
        <div v-if="activeTab === 'completed'">
          <CompletedApprovalList @view-detail="handleViewDetail" />
        </div>

        <div v-if="activeTab === 'payment-tasks'">
          <PaymentTaskList @summary-changed="handlePaymentTaskSummary" />
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

        <!-- 새 결재 생성 -->
        <div v-if="activeTab === 'create'">
          <CreateApprovalPage @created="handleRequestCreated" @cancel="handleCreateCancel" />
        </div>

        <!-- 결재 수정 -->
        <div v-if="activeTab === 'edit'">
          <CreateApprovalPage :edit-request-id="editRequestId" @created="handleRequestCreated" @cancel="handleCreateCancel" />
        </div>
      </div>
    </div>

    <!-- 결재 상세보기 모달 -->
    <ApprovalDetailModal
      :is-visible="showDetailModal"
      :request-id="selectedApproval?.id"
      @close="showDetailModal = false"
      @edit-document="handleEditRequest"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import { useUserStore } from '@/stores/useUserStore';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { useApprovalNotificationStore } from '@/stores/useApprovalNotificationStore';
import ApprovalDetailModal from './ApprovalDetailModal.vue';
import CreateApprovalPage from './CreateApprovalPage.vue';
import MyApprovalList from './MyApprovalList.vue';
import PendingApprovalList from './PendingApprovalList.vue';
import CompletedApprovalList from './CompletedApprovalList.vue';
import AllApprovalSearch from './AllApprovalSearch.vue';
import TemplateManagement from './TemplateManagement.vue';
import FavoriteGroupManagement from './FavoriteGroupManagement.vue';
import PaymentTaskList from './PaymentTaskList.vue';
import { paymentTaskApi } from '@/utils/approvalApi';

const router = useRouter();
const userStore = useUserStore();
const approvalStore = useApprovalStore();
const approvalNotificationStore = useApprovalNotificationStore();

// 상태 관리
const activeTab = ref('my-requests');
const showDetailModal = ref(false);
const selectedApproval = ref(null);
const editRequestId = ref(null);
const paymentTaskSummary = ref({ today_count: 0, confirmation_count: 0 });

// 새 결재 생성 탭으로 이동
const goToCreateApproval = () => {
  editRequestId.value = null;
  activeTab.value = 'create';
};

// 결재 수정 탭으로 이동
const handleEditRequest = (requestId) => {
  editRequestId.value = requestId;
  showDetailModal.value = false;
  activeTab.value = 'edit';
};

// 상세보기 핸들러
const handleViewDetail = (approval) => {
  selectedApproval.value = approval;
  showDetailModal.value = true;
};

// 결재 대기 개수 (웹소켓에서 실시간으로 받은 값 사용)
const pendingCount = computed(() => {
  return approvalNotificationStore.pendingApprovalCount;
});

// 초기 데이터 로드
onMounted(async () => {
  try {
    await userStore.fetchCurrentUser();
    await approvalStore.fetchPendingApprovals();
    await refreshPaymentTaskSummary();
    
    // 웹소켓 연결 (결재 알림용)
    approvalNotificationStore.connectWebSocket();
  } catch (error) {
    console.error('초기 데이터 로드 오류:', error);
  }
});

const refreshPaymentTaskSummary = async () => {
  try {
    paymentTaskSummary.value = await paymentTaskApi.getSummary();
  } catch (error) {
    console.error('납부 업무 요약 조회 오류:', error);
  }
};

const handlePaymentTaskSummary = (summary) => {
  paymentTaskSummary.value = summary;
};

// 새 결재 요청 생성 완료 핸들러
const handleRequestCreated = (createdItem) => {
  if (createdItem?.assignee_id && !createdItem?.document_number) {
    activeTab.value = 'payment-tasks';
    return;
  }
  approvalStore.fetchMyApprovalRequests();
  activeTab.value = 'my-requests';
};

// 결재 생성 취소 핸들러
const handleCreateCancel = () => {
  activeTab.value = 'my-requests';
};
</script>
