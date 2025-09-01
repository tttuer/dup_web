<template>
  <div>
    <!-- 헤더 -->
    <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">결재함</h2>
        <p class="text-gray-600 mt-1">내가 결재 완료한 목록</p>
      </div>
      
      <!-- 필터 -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- 정렬 -->
        <select
          v-model="sortBy"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          @change="refreshList"
        >
          <option value="completed_at_desc">완료일 최신순</option>
          <option value="completed_at_asc">완료일 오래된순</option>
        </select>

        <!-- 시작 날짜 -->
        <input
          v-model="startDate"
          type="date"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          @change="refreshList"
          placeholder="완료일 시작"
        />

        <!-- 종료 날짜 -->
        <input
          v-model="endDate"
          type="date"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          @change="refreshList"
          placeholder="완료일 종료"
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
          :disabled="approvalStore.loading"
          class="inline-flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': approvalStore.loading }" />
          새로고침
        </button>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="approvalStore.loading && completedApprovals.length === 0" class="flex justify-center py-12">
      <Loader class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- 결재 완료 목록이 없는 경우 -->
    <div v-else-if="completedApprovals.length === 0 && !approvalStore.loading" class="text-center py-12">
      <CheckCircle class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">결재 완료한 내역이 없습니다</h3>
      <p class="text-gray-500">아직 결재를 완료한 항목이 없습니다.</p>
    </div>

    <!-- 결재 완료 목록 -->
    <div v-else class="bg-white shadow rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                요청자
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                결재 완료일
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="approval in completedApprovals"
              :key="approval.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">
                  {{ approval.title }}
                </div>
                <div class="text-sm text-gray-500 truncate max-w-xs">
                  {{ approval.content }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <ApprovalStatus :status="approval.status" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ approval.requester_name }}</div>
                <div class="text-sm text-gray-500">{{ approval.department_name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(approval.completed_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="viewDetail(approval)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  상세보기
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 무한 스크롤을 위한 Sentinel -->
      <div 
        v-if="approvalStore.completedCurrentPage < approvalStore.completedTotalPage && !approvalStore.loading"
        ref="sentinelRef" 
        class="h-10 flex items-center justify-center"
      >
        <span class="text-sm text-gray-500">더 많은 항목을 불러오는 중...</span>
      </div>
      
      <!-- 로딩 표시 -->
      <div v-if="approvalStore.loading && completedApprovals.length > 0" class="flex justify-center py-4">
        <Loader class="w-6 h-6 animate-spin text-blue-600" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, nextTick, watch } from 'vue';
import { Loader, CheckCircle, RefreshCw } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import ApprovalStatus from './ApprovalStatus.vue';

const approvalStore = useApprovalStore();

// 상태 관리
const sortBy = ref('completed_at_desc'); // 기본값: 완료일 최신순
const startDate = ref('');
const endDate = ref('');
const sentinelRef = ref(null);
let observer = null;

const completedApprovals = computed(() => approvalStore.completedApprovals);

// 이벤트
const emit = defineEmits(['view-detail']);

// 완료한 결재 목록 조회
const refreshList = async () => {
  try {
    const params = {
      sort: sortBy.value,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined,
    };
    await approvalStore.fetchCompletedApprovals(params, true);
  } catch (error) {
    console.error('완료 목록 새로고침 오류:', error);
  }
};

// Intersection Observer 설정
const setupInfiniteScroll = () => {
  if (observer) observer.disconnect();
  
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !approvalStore.loading && approvalStore.completedCurrentPage < approvalStore.completedTotalPage) {
        approvalStore.loadNextCompletedPage();
      }
    });
  }, { 
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  if (sentinelRef.value) {
    observer.observe(sentinelRef.value);
  }
};

// Sentinel 요소 감시
watch(sentinelRef, (newSentinel, oldSentinel) => {
  if (observer) {
    if (oldSentinel) observer.unobserve(oldSentinel);
    if (newSentinel) observer.observe(newSentinel);
  }
});

// 필터 초기화
const resetFilters = () => {
  sortBy.value = 'completed_at_desc';
  startDate.value = '';
  endDate.value = '';
  refreshList();
};

// 상세 보기
const viewDetail = (approval) => {
  emit('view-detail', approval);
};

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  await refreshList();
  await nextTick();
  setupInfiniteScroll();
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>