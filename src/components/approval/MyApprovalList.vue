<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900">내가 기안한 결재</h2>
      
      <!-- 필터 -->
      <div class="flex items-center gap-2">
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 상태</option>
          <option value="DRAFT">임시저장</option>
          <option value="SUBMITTED">상신완료</option>
          <option value="IN_PROGRESS">결재진행중</option>
          <option value="APPROVED">승인완료</option>
          <option value="REJECTED">반려</option>
          <option value="CANCELLED">취소</option>
        </select>
        
        <button
          @click="refreshList"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw class="w-5 h-7" :class="{ 'animate-spin': loading }" />
          
        </button>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading && requests.length === 0" class="flex justify-center py-12">
      <Loader class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="filteredRequests.length === 0" class="text-center py-12">
      <FileText class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">결재 요청이 없습니다</h3>
      <p class="text-gray-500 mb-6">새로운 결재 요청을 작성해보세요.</p>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <Plus class="w-4 h-4 mr-2" />
        새 결재
      </button>
    </div>

    <!-- 결재 목록 -->
    <div v-else class="space-y-4">
      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        @click="viewDetail(request)"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- 제목과 문서번호 -->
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-medium text-gray-900">{{ request.title }}</h3>
                <span class="text-sm text-gray-500">#{{ request.document_number }}</span>
              </div>
              
              <!-- 내용 미리보기 -->
              <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                {{ getContentPreview(request.content) }}
              </p>
              
              <!-- 메타 정보 -->
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span class="flex items-center">
                  <Calendar class="w-4 h-4 mr-1" />
                  {{ formatDate(request.created_at) }}
                </span>
                <span v-if="request.template_name" class="flex items-center">
                  <FileText class="w-4 h-4 mr-1" />
                  {{ request.template_name }}
                </span>
              </div>
            </div>
            
            <!-- 상태 및 진행률 -->
            <div class="flex flex-col items-end space-y-3">
              <ApprovalStatus
                :status="request.status"
                :current-step="request.current_step"
                :total-steps="request.total_steps"
                :approval-lines="request.approval_lines || []"
              />
              
              <!-- 액션 버튼 -->
              <div class="flex items-center space-x-2">
                <button
                  v-if="request.status === DOCUMENT_STATUS.DRAFT"
                  @click.stop="editRequest(request)"
                  class="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  <Edit class="w-3 h-3 mr-1" />
                  수정
                </button>
                
                <button
                  v-if="canRecall(request)"
                  @click.stop="recallRequest(request)"
                  class="inline-flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <RotateCcw class="w-3 h-3 mr-1" />
                  회수
                </button>
                
                <button
                  @click.stop="viewDetail(request)"
                  class="inline-flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  <ExternalLink class="w-3 h-3 mr-1" />
                  상세
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 (필요시) -->
    <div v-if="filteredRequests.length > 0" class="flex justify-center mt-8">
      <div class="text-sm text-gray-500">
        총 {{ filteredRequests.length }}개의 결재 요청
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

  <!-- 새 결재 요청 모달 -->
  <ApprovalCreateModal
    :is-visible="showCreateModal"
    @close="showCreateModal = false"
    @created="handleRequestCreated"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  RefreshCw, Loader, FileText, Plus, Calendar, Edit, RotateCcw, ExternalLink 
} from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABELS } from '@/stores/useTypeStore';
import ApprovalStatus from './ApprovalStatus.vue';
import ApprovalDetailModal from './ApprovalDetailModal.vue';
import ApprovalCreateModal from './ApprovalCreateModal.vue';

const emit = defineEmits(['create-request']);

const approvalStore = useApprovalStore();
const userStore = useUserStore();

// 상태 관리
const loading = ref(false);
const statusFilter = ref('');
const showDetailModal = ref(false);
const selectedRequestId = ref('');
const showCreateModal = ref(false);

// 데이터
const requests = computed(() => approvalStore.myApprovalRequests);

// 필터링된 요청 목록
const filteredRequests = computed(() => {
  if (!statusFilter.value) {
    return requests.value;
  }
  return requests.value.filter(request => request.status === statusFilter.value);
});

// 데이터 새로고침
const refreshList = async () => {
  loading.value = true;
  try {
    await approvalStore.fetchMyApprovalRequests();
  } catch (error) {
    console.error('목록 새로고침 오류:', error);
  } finally {
    loading.value = false;
  }
};

// 상세 보기
const viewDetail = (request) => {
  selectedRequestId.value = request.id;
  showDetailModal.value = true;
};

// 수정 (임시저장 상태만)
const editRequest = (request) => {
  // TODO: 수정 모달 구현
  console.log('수정:', request);
};

// 회수
const recallRequest = async (request) => {
  if (!confirm(`"${request.title}" 결재를 회수하시겠습니까?`)) return;
  
  try {
    await approvalStore.recallRequest(request.id);
    await refreshList();
  } catch (error) {
    alert('회수 중 오류가 발생했습니다: ' + error.message);
  }
};

// 회수 가능 여부 체크
const canRecall = (request) => {
  return [DOCUMENT_STATUS.SUBMITTED, DOCUMENT_STATUS.IN_PROGRESS].includes(request.status) &&
         request.requester_id === userStore.currentUser?.id;
};

// 유틸리티 함수들
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '어제';
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
  // HTML 태그 제거하고 150자까지만 표시
  const text = content.replace(/<[^>]*>/g, '');
  return text.length > 150 ? text.substring(0, 150) + '...' : text;
};


// 새 결재 요청 생성 완료 핸들러
const handleRequestCreated = () => {
  showCreateModal.value = false;
  refreshList();
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