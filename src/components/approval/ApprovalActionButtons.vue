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

    <!-- 수정 버튼 -->
    <button
      v-if="canEditOrDelete"
      @click="handleEdit"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50"
    >
      <Edit class="w-4 h-4 mr-2" />
      수정
    </button>

    <!-- 삭제 버튼 -->
    <button
      v-if="canEditOrDelete"
      @click="handleDelete"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200 disabled:opacity-50"
    >
      <Trash2 class="w-4 h-4 mr-2" />
      삭제
    </button>

    <!-- 승인 버튼 -->
    <button
      v-if="canApprove"
      @click="openApproveModal"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
    >
      <Check class="w-4 h-4 mr-2" />
      승인
    </button>

    <!-- 반려 버튼 -->
    <button
      v-if="canReject"
      @click="openRejectModal"
      :disabled="loading"
      class="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
    >
      <X class="w-4 h-4 mr-2" />
      반려
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

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          첨부 파일 (선택사항)
        </label>
        <input
          type="file"
          multiple
          @change="handleApproveFileChange"
          class="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
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

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          첨부 파일 (선택사항)
        </label>
        <input
          type="file"
          multiple
          @change="handleRejectFileChange"
          class="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-red-50 file:text-red-700
            hover:file:bg-red-100"
        />
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
import { Send, Check, X, Users, Loader, Edit, Trash2 } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import { DOCUMENT_STATUS } from '@/stores/useTypeStore';
import { useToast } from 'vue-toastification';

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

const emit = defineEmits(['action-completed', 'edit-approval-line', 'edit-document']);

const approvalStore = useApprovalStore();
const userStore = useUserStore();
const toast = useToast();

// 상태 관리
const loading = ref(false);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const approveComment = ref('');
const rejectComment = ref('');
const approveFiles = ref([]);
const rejectFiles = ref([]);

const handleApproveFileChange = (e) => {
  approveFiles.value = Array.from(e.target.files);
};

const handleRejectFileChange = (e) => {
  rejectFiles.value = Array.from(e.target.files);
};

// 권한 체크
const canSubmit = computed(() => {
  if (!userStore.currentUser) return false;
  const isRequester = String(props.request.requester_id) === String(userStore.currentUser.id) || 
                      String(props.request.requester_id) === String(userStore.currentUser.user_id);
  return props.request.status === DOCUMENT_STATUS.DRAFT &&
         isRequester &&
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

const canEditApprovalLine = computed(() => {
  if (!userStore.currentUser) return false;
  const isRequester = String(props.request.requester_id) === String(userStore.currentUser.id) || 
                      String(props.request.requester_id) === String(userStore.currentUser.user_id);
  return props.request.status === DOCUMENT_STATUS.DRAFT &&
         isRequester;
});

const canEditOrDelete = computed(() => {
  if (!props.request || !userStore.currentUser) return false;
  const isRequester = String(props.request.requester_id) === String(userStore.currentUser.id) || 
                      String(props.request.requester_id) === String(userStore.currentUser.user_id);
  if (!isRequester) return false;
  if (!props.approvalLines || props.approvalLines.length === 0) return true; // 결재선이 없어도 삭제/수정 가능 (임시저장 등의 경우)
  
  // 승인/반려된 결재선이 하나도 없어야 함 (모두 PENDING 이거나 초기 상태)
  const hasProcessed = props.approvalLines.some(line => ['APPROVED', 'REJECTED'].includes(line.status));
  return !hasProcessed;
});

// 액션 핸들러들
const handleSubmit = async () => {
  if (!confirm('결재를 상신하시겠습니까?')) return;
  
  loading.value = true;
  try {
    await approvalStore.submitApproval(props.request.id);
    toast.success('결재가 상신되었습니다.');
    emit('action-completed', 'submit');
  } catch (error) {
    toast.error('상신 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleEdit = () => {
  emit('edit-document', props.request.id);
};

const handleDelete = async () => {
  if (!confirm(`"${props.request.title}" 결재를 삭제하시겠습니까?`)) return;
  
  loading.value = true;
  try {
    await approvalStore.deleteApprovalRequest(props.request.id);
    toast.success('결재가 삭제되었습니다.');
    emit('action-completed', 'delete');
  } catch (error) {
    toast.error('삭제 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleApprove = async () => {
  loading.value = true;
  try {
    await approvalStore.approveRequest(props.request.id, approveComment.value, approveFiles.value);
    showApproveModal.value = false;
    approveComment.value = '';
    approveFiles.value = [];
    toast.success('승인 처리되었습니다.');
    emit('action-completed', 'approve');
  } catch (error) {
    toast.error('승인 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const handleReject = async () => {
  if (!rejectComment.value.trim()) {
    toast.warning('반려 사유를 입력해주세요.');
    return;
  }
  
  loading.value = true;
  try {
    await approvalStore.rejectRequest(props.request.id, rejectComment.value, rejectFiles.value);
    showRejectModal.value = false;
    rejectComment.value = '';
    rejectFiles.value = [];
    toast.success('반려 처리되었습니다.');
    emit('action-completed', 'reject');
  } catch (error) {
    toast.error('반려 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

</script>