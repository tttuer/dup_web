<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900">기안함</h2>
      
      
      <!-- 필터 및 정렬 -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- 상태 필터 -->
        <select
          v-model="statusFilter"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="refreshList"
        >
          <option value="">전체 상태</option>
          <option value="SUBMITTED">상신완료</option>
          <option value="IN_PROGRESS">결재진행중</option>
          <option value="APPROVED">승인완료</option>
          <option value="REJECTED">반려</option>
        </select>

        <!-- 정렬 -->
        <select
          v-model="sortBy"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="refreshList"
        >
          <option value="created_at_desc">최신순</option>
          <option value="created_at_asc">오래된순</option>
        </select>

        <!-- 시작 날짜 -->
        <input
          v-model="startDate"
          type="date"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="refreshList"
          placeholder="시작 날짜"
        />

        <!-- 종료 날짜 -->
        <input
          v-model="endDate"
          type="date"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="refreshList"
          placeholder="종료 날짜"
        />

        <!-- 필터 초기화 -->
        <button
          @click="resetFilters"
          class="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
          title="필터 초기화"
        >
          초기화
        </button>
        
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
    <div v-else-if="requests.length === 0" class="text-center py-12">
      <FileText class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">결재 요청이 없습니다</h3>
      <p class="text-gray-500 mb-6">새로운 결재 요청을 작성해보세요.</p>
      <button
        @click="emit('create-request')"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <Plus class="w-4 h-4 mr-2" />
        새 결재
      </button>
    </div>

    <!-- 결재 목록 -->
    <div v-else class="space-y-2">
      <div
        v-for="request in requests"
        :key="request.id"
        class="bg-white rounded-md border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
        @click="viewDetail(request)"
      >
        <div class="p-4">
          <div class="flex items-center justify-between">
            <!-- 왼쪽: 제목, 문서번호, 날짜 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <h3 class="text-sm font-medium text-gray-900 truncate">{{ request.title }}</h3>
                <span class="text-xs text-gray-500 flex-shrink-0">#{{ request.document_number }}</span>
              </div>
              
              <div class="flex items-center space-x-3 text-xs text-gray-500">
                <span class="flex items-center">
                  <Calendar class="w-3 h-3 mr-1" />
                  {{ formatDate(request.created_at) }}
                </span>
                <span v-if="request.template_name" class="flex items-center truncate">
                  <FileText class="w-3 h-3 mr-1" />
                  {{ request.template_name }}
                </span>
              </div>
            </div>
            
            <!-- 가운데: 내용 미리보기 -->
            <div class="flex-1 px-4 min-w-0">
              <p class="text-xs text-gray-600 truncate">
                {{ getContentPreview(request.content) }}
              </p>
            </div>
            
            <!-- 오른쪽: 상태 및 액션 -->
            <div class="flex items-center space-x-3 flex-shrink-0">
              <ApprovalStatus
                :status="request.status"
                :current-step="request.current_step"
                :total-steps="request.total_steps"
                :approval-lines="request.approval_lines || []"
                compact
              />
              
              <!-- 액션 버튼 -->
              <div class="flex items-center space-x-1">
                <button
                  v-if="request.status === DOCUMENT_STATUS.DRAFT"
                  @click.stop="editRequest(request)"
                  class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="수정"
                >
                  <Edit class="w-3 h-3" />
                </button>
                
                <button
                  v-if="canRecall(request)"
                  @click.stop="recallRequest(request)"
                  class="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="회수"
                >
                  <RotateCcw class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 (필요시) -->
    <div v-if="requests.length > 0" class="flex justify-center mt-8">
      <div class="text-sm text-gray-500">
        총 {{ requests.length }}개의 결재 요청
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

const emit = defineEmits(['create-request']);

const approvalStore = useApprovalStore();
const userStore = useUserStore();

// 상태 관리
const loading = ref(false);
const statusFilter = ref('');
const sortBy = ref('created_at_desc'); // 기본값: 최신순
const startDate = ref('');
const endDate = ref('');
const showDetailModal = ref(false);
const selectedRequestId = ref('');

// 데이터
const requests = computed(() => approvalStore.myApprovalRequests);

// 백엔드에서 필터링이 되므로 바로 requests 사용

// 데이터 새로고침
const refreshList = async () => {
  loading.value = true;
  try {
    const params = {
      status: statusFilter.value || undefined,
      sort: sortBy.value,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
    };
    await approvalStore.fetchMyApprovalRequests(params);
  } catch (error) {
    console.error('목록 새로고침 오류:', error);
  } finally {
    loading.value = false;
  }
};

// 필터 초기화
const resetFilters = () => {
  statusFilter.value = '';
  sortBy.value = 'created_at_desc';
  startDate.value = '';
  endDate.value = '';
  refreshList();
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
  
  // 날짜만 비교 (시간 제거)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffMs = nowOnly - dateOnly;
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
  if (!content) return '내용 없음';
  // HTML 태그 제거하고 150자까지만 표시
  const text = content.replace(/<[^>]*>/g, '').trim();
  if (!text) return '내용 없음';
  return text.length > 100 ? text.substring(0, 100) + '...' : text;
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