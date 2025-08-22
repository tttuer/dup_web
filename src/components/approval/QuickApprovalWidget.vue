<template>
  <!-- 바우처/파일과 연결된 간단한 결재 위젯 -->
  <div v-if="showWidget" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center space-x-2 mb-2">
          <FileCheck class="w-5 h-5 text-blue-600" />
          <h4 class="font-medium text-blue-900">결재 연동</h4>
        </div>
        
        <!-- 결재 상태가 있는 경우 -->
        <div v-if="approvalStatus" class="space-y-2">
          <div class="flex items-center space-x-3">
            <ApprovalStatus :status="approvalStatus.status" />
            <span class="text-sm text-gray-600">
              {{ approvalStatus.title }}
            </span>
          </div>
          <div class="flex items-center space-x-2 text-sm">
            <a 
              :href="`/approval?request=${approvalStatus.id}`"
              target="_blank"
              class="text-blue-600 hover:text-blue-800 underline"
            >
              결재 상세 보기
            </a>
            <span class="text-gray-400">|</span>
            <span class="text-gray-500">
              {{ formatDate(approvalStatus.created_at) }}
            </span>
          </div>
        </div>
        
        <!-- 결재 상태가 없는 경우 -->
        <div v-else class="space-y-2">
          <p class="text-sm text-gray-600">
            이 {{ itemType }}에 대한 결재를 요청할 수 있습니다.
          </p>
          <button
            @click="createApprovalRequest"
            class="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus class="w-4 h-4 mr-1" />
            결재 요청 생성
          </button>
        </div>
      </div>
      
      <button
        @click="hideWidget"
        class="text-gray-400 hover:text-gray-600"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { FileCheck, Plus, X } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import ApprovalStatus from './ApprovalStatus.vue';

const props = defineProps({
  itemId: {
    type: String,
    required: true,
  },
  itemType: {
    type: String, // 'voucher' 또는 'file'
    required: true,
  },
  itemTitle: {
    type: String,
    default: '',
  },
});

const approvalStore = useApprovalStore();

// 상태 관리
const showWidget = ref(true);
const approvalStatus = ref(null);

// 연결된 결재 조회
const checkApprovalStatus = async () => {
  try {
    // 실제로는 백엔드에서 itemId와 연결된 결재를 조회해야 함
    // 여기서는 예시로 구현
    const response = await fetch(`/api/approvals/check?item_id=${props.itemId}&item_type=${props.itemType}`);
    if (response.ok) {
      const data = await response.json();
      approvalStatus.value = data;
    }
  } catch (error) {
    console.error('결재 상태 확인 오류:', error);
  }
};

// 결재 요청 생성
const createApprovalRequest = async () => {
  try {
    const requestData = {
      title: `${props.itemType === 'voucher' ? '전표' : '파일'} 결재 요청: ${props.itemTitle}`,
      content: `${props.itemType === 'voucher' ? '전표' : '파일'} ID: ${props.itemId}에 대한 결재를 요청합니다.`,
      visibility: 'DEPARTMENT',
      related_item_id: props.itemId,
      related_item_type: props.itemType,
    };
    
    const result = await approvalStore.createApprovalRequest(requestData);
    
    if (result) {
      alert('결재 요청이 생성되었습니다.');
      await checkApprovalStatus(); // 상태 새로고침
    }
  } catch (error) {
    alert('결재 요청 생성 중 오류가 발생했습니다: ' + error.message);
  }
};

// 위젯 숨기기
const hideWidget = () => {
  showWidget.value = false;
  localStorage.setItem(`approval-widget-hidden-${props.itemId}`, 'true');
};

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ko-KR');
};

onMounted(() => {
  // 숨김 상태 확인
  const isHidden = localStorage.getItem(`approval-widget-hidden-${props.itemId}`);
  if (isHidden) {
    showWidget.value = false;
    return;
  }
  
  checkApprovalStatus();
});
</script>