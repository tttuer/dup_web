<template>
  <div class="flex items-center space-x-3">
    <!-- 상신 버튼 (임시저장 상태일 때) -->
    <button
      v-if="canSubmit"
      @click="handleSubmit"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      <Send class="w-4 h-4 mr-2" />
      상신하기
    </button>

    <!-- 승인 버튼 -->
    <button
      v-if="canApprove"
      @click="showApproveModal = true"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      <Check class="w-4 h-4 mr-2" />
      승인
    </button>

    <!-- 반려 버튼 -->
    <button
      v-if="canReject"
      @click="showRejectModal = true"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
    >
      <X class="w-4 h-4 mr-2" />
      반려
    </button>

    <!-- 회수 버튼 -->
    <button
      v-if="canRecall"
      @click="handleRecall"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50"
    >
      <RotateCcw class="w-4 h-4 mr-2" />
      회수
    </button>

    <!-- 결재선 설정 버튼 (초안일 때만) -->
    <button
      v-if="canEditApprovalLine"
      @click="$emit('edit-approval-line')"
      class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
    >
      <Users class="w-4 h-4 mr-2" />
      결재선 설정
    </button>
  </div>

  <!-- 승인 모달 -->
  <div 
    v-if="showApproveModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="showApproveModal = false"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">결재 승인</h3>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          승인 의견 (선택사항)
        </label>
        <textarea
          v-model="approveComment"
          rows="3"
          placeholder="승인 의견을 입력하세요..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          @click="showApproveModal = false"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          취소
        </button>
        <button
          @click="handleApprove"
          :disabled="loading"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
          승인
        </button>
      </div>
    </div>
  </div>

  <!-- 반려 모달 -->
  <div 
    v-if="showRejectModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="showRejectModal = false"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">결재 반려</h3>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          반려 사유 <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="rejectComment"
          rows="4"
          placeholder="반려 사유를 입력하세요..."
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          @click="showRejectModal = false"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          취소
        </button>
        <button
          @click="handleReject"
          :disabled="loading || !rejectComment.trim()"
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
          반려
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Send, Check, X, RotateCcw, Users, Loader } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import { DOCUMENT_STATUS } from '@/stores/useTypeStore';

const props = defineProps({
  request: {
    type: Object,
    required: true,
  },
  approvalLines: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['action-completed', 'edit-approval-line']);

const approvalStore = useApprovalStore();
const userStore = useUserStore();

// 상태 관리
const loading = ref(false);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const approveComment = ref('');
const rejectComment = ref('');

// 권한 체크
const canSubmit = computed(() => {
  return props.request.status === DOCUMENT_STATUS.DRAFT &&
         props.request.requester_id === userStore.currentUser?.id &&
         props.approvalLines.length > 0;
});

const canApprove = computed(() => {
  if (!userStore.currentUser || props.request.status !== DOCUMENT_STATUS.IN_PROGRESS) {
    return false;
  }
  
  // 현재 단계의 결재자인지 확인
  const currentStepLines = props.approvalLines.filter(line => 
    line.step_order === props.request.current_step && 
    line.status === 'PENDING'
  );
  
  return currentStepLines.some(line => line.approver_id === userStore.currentUser.id);
});

const canReject = computed(() => {
  return canApprove.value;
});

const canRecall = computed(() => {
  return [DOCUMENT_STATUS.SUBMITTED, DOCUMENT_STATUS.IN_PROGRESS].includes(props.request.status) &&
         props.request.requester_id === userStore.currentUser?.id;
});

const canEditApprovalLine = computed(() => {
  return props.request.status === DOCUMENT_STATUS.DRAFT &&
         props.request.requester_id === userStore.currentUser?.id;
});

// 액션 핸들러들
const handleSubmit = async () => {
  if (!confirm('결재를 상신하시겠습니까?')) return;
  
  loading.value = true;
  try {
    await approvalStore.submitApproval(props.request.id);
    emit('action-completed', 'submit');
  } catch (error) {
    alert('상신 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleApprove = async () => {
  loading.value = true;
  try {
    await approvalStore.approveRequest(props.request.id, approveComment.value);
    showApproveModal.value = false;
    approveComment.value = '';
    emit('action-completed', 'approve');
  } catch (error) {
    alert('승인 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleReject = async () => {
  if (!rejectComment.value.trim()) {
    alert('반려 사유를 입력해주세요.');
    return;
  }
  
  loading.value = true;
  try {
    await approvalStore.rejectRequest(props.request.id, rejectComment.value);
    showRejectModal.value = false;
    rejectComment.value = '';
    emit('action-completed', 'reject');
  } catch (error) {
    alert('반려 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleRecall = async () => {
  if (!confirm('결재를 회수하시겠습니까?')) return;
  
  loading.value = true;
  try {
    await approvalStore.recallRequest(props.request.id);
    emit('action-completed', 'recall');
  } catch (error) {
    alert('회수 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};
</script>