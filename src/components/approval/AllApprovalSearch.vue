<template>
  <div class="space-y-6">
    <!-- 검색 필터 -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-medium text-gray-900 mb-4">전자결재 목록</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 검색어 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">검색어</label>
          <input
            v-model="searchFilters.query"
            type="text"
            placeholder="제목, 내용 또는 요청자로 검색..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="searchApprovals"
          />
        </div>
        
        <!-- 상태 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            v-model="searchFilters.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="SUBMITTED">상신완료</option>
            <option value="IN_PROGRESS">결재진행중</option>
            <option value="APPROVED">승인완료</option>
            <option value="REJECTED">반려</option>
          </select>
        </div>
        
        <!-- 시작 날짜 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
          <div class="relative">
            <input
              v-model="searchFilters.startDate"
              type="date"
              class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Calendar class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        <!-- 종료 날짜 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
          <div class="relative">
            <input
              v-model="searchFilters.endDate"
              type="date"
              class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Calendar class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      <!-- 빠른 날짜 선택 -->
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="text-sm font-medium text-gray-700">빠른 선택:</span>
        <button
          @click="setDateRange('today')"
          class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          오늘
        </button>
        <button
          @click="setDateRange('week')"
          class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          최근 1주일
        </button>
        <button
          @click="setDateRange('month')"
          class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          최근 1개월
        </button>
        <button
          @click="setDateRange('quarter')"
          class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          최근 3개월
        </button>
      </div>
      
      <div class="mt-4 flex justify-end space-x-2">
        <button
          @click="resetFilters"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          초기화
        </button>
        <button
          @click="searchApprovals"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
          검색
        </button>
      </div>
    </div>
    
    <!-- 검색 결과 -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">
            검색 결과 
            <span v-if="searchResults.length > 0" class="text-sm text-gray-500">
              ({{ searchResults.length }}건)
            </span>
          </h3>
        </div>
      </div>
      
      <!-- 로딩 상태 -->
      <div v-if="loading" class="p-8 text-center">
        <Loader class="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p class="text-gray-500 mt-2">결재 목록을 불러오는 중...</p>
      </div>
      
      <!-- 결과가 없는 경우 -->
      <div v-else-if="searchResults.length === 0" class="p-8 text-center">
        <FileX class="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">결재 내역이 없습니다</h3>
        <p class="text-gray-500">아직 등록된 전자결재가 없습니다.</p>
      </div>
      
      <!-- 검색 결과 테이블 -->
      <div v-else class="overflow-x-auto">
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
                생성일
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="approval in searchResults"
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
                {{ formatDate(approval.created_at) }}
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
      
      <!-- 페이징 (추후 구현 가능) -->
      <div v-if="searchResults.length > 0" class="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm text-gray-700">
          <span>총 {{ searchResults.length }}건</span>
          <!-- 페이징 버튼들 추후 추가 가능 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Loader, Search, FileX, Calendar } from 'lucide-vue-next';
import { authFetch } from '@/utils/authFetch';
import ApprovalStatus from './ApprovalStatus.vue';

// 상태 관리
const loading = ref(false);
const searchResults = ref([]);

// 검색 필터
const searchFilters = reactive({
  query: '',
  status: '',
  startDate: '',
  endDate: ''
});

// 이벤트
const emit = defineEmits(['view-detail']);

// 전자결재 목록 조회 (검색 포함)
const loadApprovals = async (isSearch = false) => {
  loading.value = true;
  
  try {
    const params = new URLSearchParams();
    
    // 검색 조건이 있는 경우에만 추가
    if (isSearch) {
      if (searchFilters.query) params.append('q', searchFilters.query);
      if (searchFilters.status) params.append('status', searchFilters.status);
      if (searchFilters.startDate) params.append('start_date', searchFilters.startDate);
      if (searchFilters.endDate) params.append('end_date', searchFilters.endDate);
    }
    
    const APPROVAL_API_URL = import.meta.env.VITE_APPROVAL_API_URL;
    const response = await authFetch(`${APPROVAL_API_URL}/search?${params.toString()}`);
    
    if (response.ok) {
      const data = await response.json();
      searchResults.value = data;
    } else {
      throw new Error('목록 조회 실패');
    }
  } catch (error) {
    console.error('목록 조회 오류:', error);
    alert('목록 조회 중 오류가 발생했습니다: ' + error.message);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
};

// 검색 실행
const searchApprovals = () => {
  loadApprovals(true);
};

// 빠른 날짜 범위 설정
const setDateRange = (range) => {
  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  switch (range) {
    case 'today':
      searchFilters.startDate = formatDate(today);
      searchFilters.endDate = formatDate(today);
      break;
    case 'week':
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      searchFilters.startDate = formatDate(weekAgo);
      searchFilters.endDate = formatDate(today);
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      searchFilters.startDate = formatDate(monthAgo);
      searchFilters.endDate = formatDate(today);
      break;
    case 'quarter':
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      searchFilters.startDate = formatDate(quarterAgo);
      searchFilters.endDate = formatDate(today);
      break;
  }
};

// 필터 초기화 및 전체 목록 다시 로드
const resetFilters = () => {
  searchFilters.query = '';
  searchFilters.status = '';
  searchFilters.startDate = '';
  searchFilters.endDate = '';
  loadApprovals(false); // 전체 목록 다시 로드
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

// 컴포넌트 마운트 시 전체 목록 자동 로드
onMounted(() => {
  loadApprovals(false); // 전체 목록 로드
});
</script>