<template>
  <div>
    <!-- 헤더 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">결재함</h2>
        <p class="text-gray-600 mt-1">내가 결재 완료한 목록</p>
      </div>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loader class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- 결재 완료 목록이 없는 경우 -->
    <div v-else-if="completedApprovals.length === 0" class="text-center py-12">
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
      
      <!-- 페이징 정보 -->
      <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm text-gray-700">
          <span>총 {{ completedApprovals.length }}건</span>
          <span>내가 결재 완료한 항목들</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Loader, CheckCircle } from 'lucide-vue-next';
import { authFetch } from '@/utils/authFetch';
import ApprovalStatus from './ApprovalStatus.vue';

// 상태 관리
const loading = ref(false);
const completedApprovals = ref([]);

// 이벤트
const emit = defineEmits(['view-detail']);

// 완료한 결재 목록 조회
const loadCompletedApprovals = async () => {
  loading.value = true;
  try {
    const APPROVAL_API_URL = import.meta.env.VITE_APPROVAL_API_URL;
    const response = await authFetch(`${APPROVAL_API_URL}/completed`);
    
    if (response.ok) {
      const data = await response.json();
      completedApprovals.value = data;
    } else {
      throw new Error('결재 완료 목록 조회 실패');
    }
  } catch (error) {
    console.error('결재 완료 목록 조회 오류:', error);
    alert('결재 완료 목록 조회 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
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
onMounted(() => {
  loadCompletedApprovals();
});
</script>