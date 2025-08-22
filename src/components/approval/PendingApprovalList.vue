<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">결재 대기 목록</h2>
        <p class="text-gray-600 mt-1">내가 결재해야 할 요청들입니다.</p>
      </div>
      
      <button
        @click="refreshList"
        :disabled="loading"
        class="inline-flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
      >
        <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
        새로고침
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading && pendingRequests.length === 0" class="flex justify-center py-12">
      <Loader class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="pendingRequests.length === 0" class="text-center py-12">
      <Clock class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">결재 대기 중인 요청이 없습니다</h3>
      <p class="text-gray-500">새로운 결재 요청이 오면 여기에 표시됩니다.</p>
    </div>

    <!-- 결재 대기 목록 -->
    <div v-else class="space-y-4">
      <div
        v-for="request in pendingRequests"
        :key="request.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- 제목과 기안자 -->
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-medium text-gray-900">{{ request.title }}</h3>
                <span class="text-sm text-gray-500">#{{ request.document_number }}</span>
              </div>
              
              <!-- 기안자 정보 -->
              <div class="flex items-center space-x-4 mb-3">
                <span class="flex items-center text-sm text-gray-600">
                  <User class="w-4 h-4 mr-1" />
                  {{ request.requester_name }}
                </span>
                <span v-if="request.department" class="text-sm text-gray-500">
                  {{ request.department }}
                </span>
              </div>
              
              <!-- 내용 미리보기 -->
              <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                {{ getContentPreview(request.content) }}
              </p>
              
              <!-- 메타 정보 -->
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <Calendar class="w-4 h-4 mr-1" />
                  {{ formatDate(request.submitted_at || request.created_at) }}
                </span>
                <span v-if="request.template_name" class="flex items-center">
                  <FileText class="w-4 h-4 mr-1" />
                  {{ request.template_name }}
                </span>
                <span class="flex items-center">
                  <Clock class="w-4 h-4 mr-1" />
                  {{ getUrgencyLabel(request) }}
                </span>
              </div>
            </div>
            
            <!-- 우측 액션 영역 -->
            <div class="flex flex-col items-end space-y-3">
              <!-- 현재 결재 단계 -->
              <div class="text-right">
                <div class="text-sm font-medium text-blue-600">
                  {{ request.current_step }}단계 결재
                </div>
                <div class="text-xs text-gray-500">
                  {{ getTotalSteps(request) }}단계 중
                </div>
              </div>
              
              <!-- 액션 버튼 -->
              <div class="flex items-center space-x-2">
                <button
                  @click="viewDetail(request)"
                  class="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Eye class="w-3 h-3 mr-1" />
                  상세보기
                </button>
                
                <button
                  @click="approveRequest(request)"
                  class="inline-flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <Check class="w-3 h-3 mr-1" />
                  승인
                </button>
                
                <button
                  @click="rejectRequest(request)"
                  class="inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <X class="w-3 h-3 mr-1" />
                  반려
                </button>
              </div>
            </div>
          </div>
          
          <!-- 결재선 미리보기 -->
          <div v-if="request.approval_lines && request.approval_lines.length > 0" class="mt-4 pt-4 border-t border-gray-100">
            <div class="flex items-center space-x-4">
              <span class="text-sm font-medium text-gray-700">결재선:</span>
              <div class="flex items-center space-x-2">
                <div
                  v-for="(line, index) in request.approval_lines.slice(0, 5)"
                  :key="`line-${index}`"
                  class="flex items-center"
                >
                  <div 
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                    :class="getApprovalLineStyle(line, request.current_step)"
                  >
                    {{ index + 1 }}
                  </div>
                  <span v-if="index < Math.min(request.approval_lines.length, 5) - 1" class="mx-1 text-gray-300">
                    →
                  </span>
                </div>
                <span v-if="request.approval_lines.length > 5" class="text-xs text-gray-500">
                  +{{ request.approval_lines.length - 5 }}명
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 상세 모달 -->
  <ApprovalDetailModal
    :is-visible="showDetailModal"
    :request-id="selectedRequestId"
    @close="showDetailModal = false"
    @updated="refreshList"
  />

  <!-- 빠른 승인 모달 -->
  <div 
    v-if="showQuickApproveModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="showQuickApproveModal = false"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">빠른 승인</h3>
      
      <div class="mb-4">
        <div class="font-medium mb-2">{{ quickActionRequest?.title }}</div>
        <div class="text-sm text-gray-600">{{ quickActionRequest?.requester_name }}</div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          승인 의견 (선택사항)
        </label>
        <textarea
          v-model="quickApproveComment"
          rows="3"
          placeholder="승인 의견을 입력하세요..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          @click="showQuickApproveModal = false"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          취소
        </button>
        <button
          @click="confirmQuickApprove"
          :disabled="quickActionLoading"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <Loader v-if="quickActionLoading" class="w-4 h-4 animate-spin mr-2" />
          승인
        </button>
      </div>
    </div>
  </div>

  <!-- 빠른 반려 모달 -->
  <div 
    v-if="showQuickRejectModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="showQuickRejectModal = false"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">빠른 반려</h3>
      
      <div class="mb-4">
        <div class="font-medium mb-2">{{ quickActionRequest?.title }}</div>
        <div class="text-sm text-gray-600">{{ quickActionRequest?.requester_name }}</div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          반려 사유 <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="quickRejectComment"
          rows="4"
          placeholder="반려 사유를 입력하세요..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          @click="showQuickRejectModal = false"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          취소
        </button>
        <button
          @click="confirmQuickReject"
          :disabled="quickActionLoading || !quickRejectComment.trim()"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          <Loader v-if="quickActionLoading" class="w-4 h-4 animate-spin mr-2" />
          반려
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  RefreshCw, Loader, Clock, User, Calendar, FileText, Eye, Check, X 
} from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import ApprovalDetailModal from './ApprovalDetailModal.vue';

const approvalStore = useApprovalStore();

// 상태 관리
const loading = ref(false);
const showDetailModal = ref(false);
const selectedRequestId = ref('');
const showQuickApproveModal = ref(false);
const showQuickRejectModal = ref(false);
const quickActionRequest = ref(null);
const quickApproveComment = ref('');
const quickRejectComment = ref('');
const quickActionLoading = ref(false);

// 데이터
const pendingRequests = computed(() => approvalStore.pendingApprovals);

// 데이터 새로고침
const refreshList = async () => {
  loading.value = true;
  try {
    await approvalStore.fetchPendingApprovals();
  } catch (error) {
    console.error('대기 목록 새로고침 오류:', error);
  } finally {
    loading.value = false;
  }
};

// 상세 보기
const viewDetail = (request) => {
  selectedRequestId.value = request.id;
  showDetailModal.value = true;
};

// 빠른 승인
const approveRequest = (request) => {
  quickActionRequest.value = request;
  quickApproveComment.value = '';
  showQuickApproveModal.value = true;
};

const confirmQuickApprove = async () => {
  if (!quickActionRequest.value) return;
  
  quickActionLoading.value = true;
  try {
    await approvalStore.approveRequest(
      quickActionRequest.value.id, 
      quickApproveComment.value
    );
    showQuickApproveModal.value = false;
    await refreshList();
  } catch (error) {
    alert('승인 중 오류가 발생했습니다: ' + error.message);
  } finally {
    quickActionLoading.value = false;
  }
};

// 빠른 반려
const rejectRequest = (request) => {
  quickActionRequest.value = request;
  quickRejectComment.value = '';
  showQuickRejectModal.value = true;
};

const confirmQuickReject = async () => {
  if (!quickActionRequest.value || !quickRejectComment.value.trim()) return;
  
  quickActionLoading.value = true;
  try {
    await approvalStore.rejectRequest(
      quickActionRequest.value.id, 
      quickRejectComment.value
    );
    showQuickRejectModal.value = false;
    await refreshList();
  } catch (error) {
    alert('반려 중 오류가 발생했습니다: ' + error.message);
  } finally {
    quickActionLoading.value = false;
  }
};

// 유틸리티 함수들
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
};

const getContentPreview = (content) => {
  if (!content) return '';
  const text = content.replace(/<[^>]*>/g, '');
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
};

const getUrgencyLabel = (request) => {
  const createdDate = new Date(request.submitted_at || request.created_at);
  const now = new Date();
  const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 3) {
    return '긴급';
  } else if (diffDays >= 1) {
    return '보통';
  } else {
    return '신규';
  }
};

const getTotalSteps = (request) => {
  return request.approval_lines ? request.approval_lines.length : 0;
};

const getApprovalLineStyle = (line, currentStep) => {
  if (line.step_order < currentStep) {
    return 'bg-green-100 text-green-800';
  } else if (line.step_order === currentStep) {
    return 'bg-blue-100 text-blue-800';
  } else {
    return 'bg-gray-100 text-gray-600';
  }
};

// 초기 데이터 로드
onMounted(() => {
  refreshList();
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>