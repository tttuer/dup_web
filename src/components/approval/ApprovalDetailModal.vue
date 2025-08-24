<template>
  <div 
    v-if="isVisible" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <!-- 헤더 -->
      <div class="flex justify-between items-center p-6 border-b">
        <h3 class="text-xl font-semibold">결재 상세</h3>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader class="w-8 h-8 animate-spin text-blue-600" />
      </div>

      <!-- 콘텐츠 -->
      <div v-else-if="request" class="p-6 space-y-6">
        <!-- 기본 정보 -->
        <div class="grid grid-cols-1 gap-6">
          <div>
            <h4 class="font-semibold text-gray-900 mb-3">기본 정보</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">문서번호:</span>
                <span class="font-medium">{{ request.document_number }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">상태:</span>
                <ApprovalStatus :status="request.status" />
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">기안자:</span>
                <span>{{ request.requester_name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">작성일:</span>
                <span>{{ formatDate(request.created_at) }}</span>
              </div>
              <div v-if="request.submitted_at" class="flex justify-between">
                <span class="text-gray-600">상신일:</span>
                <span>{{ formatDate(request.submitted_at) }}</span>
              </div>
            </div>
          </div>
          
        </div>

        <!-- 제목 -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">제목</h4>
          <p class="text-lg">{{ request.title }}</p>
        </div>

        <!-- 내용 -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-2">내용</h4>
          <div class="prose max-w-none p-4 bg-gray-50 rounded-md">
            <div v-html="request.content"></div>
          </div>
        </div>

        <!-- 결재선 및 진행 현황 -->
        <ApprovalHistory
          :request-id="requestId"
          :approval-lines="approvalLines"
          :current-step="request.current_step"
        />

        <!-- 첨부파일 -->
        <div v-if="attachedFiles.length > 0">
          <h4 class="font-semibold text-gray-900 mb-3">첨부파일</h4>
          <div class="space-y-2">
            <div
              v-for="file in attachedFiles"
              :key="file.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div class="flex items-center space-x-3">
                <component :is="getFileIcon(file.file_name)" class="w-5 h-5 text-gray-400" />
                <div>
                  <div class="font-medium">{{ file.file_name }}</div>
                  <div class="text-sm text-gray-500">{{ formatFileSize(file.file_size) }}</div>
                </div>
              </div>
              <button
                @click="downloadFile(file)"
                class="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                <Download class="w-4 h-4 mr-1" />
                다운로드
              </button>
            </div>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div class="border-t pt-6">
          <ApprovalActionButtons
            :request="request"
            :approval-lines="approvalLines"
            @action-completed="handleActionCompleted"
            @edit-approval-line="showApprovalLineModal = true"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 결재선 설정 모달 -->
  <ApprovalLineModal
    :is-visible="showApprovalLineModal"
    :request-id="requestId"
    :initial-lines="approvalLines"
    @close="showApprovalLineModal = false"
    @save="handleApprovalLineSave"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X, Loader, Download, FileText, File } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { fileApi, approvalUtils } from '@/utils/approvalApi';
import ApprovalStatus from './ApprovalStatus.vue';
import ApprovalHistory from './ApprovalHistory.vue';
import ApprovalActionButtons from './ApprovalActionButtons.vue';
import ApprovalLineModal from './ApprovalLineModal.vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  requestId: {
    type: String,
    required: false,
    default: null,
  },
});

const emit = defineEmits(['close', 'updated']);

const approvalStore = useApprovalStore();

// 상태 관리
const loading = ref(false);
const showApprovalLineModal = ref(false);
const attachedFiles = ref([]);

// 데이터
const request = computed(() => approvalStore.approvalDetail);
const approvalLines = computed(() => approvalStore.approvalLines);

// 상세 정보 로드
const loadDetail = async () => {
  if (!props.requestId) return;
  
  loading.value = true;
  try {
    await Promise.all([
      approvalStore.fetchApprovalDetail(props.requestId),
      approvalStore.fetchApprovalLines(props.requestId),
      loadAttachedFiles(),
    ]);
  } catch (error) {
    console.error('상세 정보 로드 오류:', error);
  } finally {
    loading.value = false;
  }
};

// 첨부파일 로드
const loadAttachedFiles = async () => {
  try {
    const files = await fileApi.getFiles(props.requestId);
    attachedFiles.value = files;
  } catch (error) {
    console.error('첨부파일 로드 오류:', error);
    attachedFiles.value = [];
  }
};

// 파일 다운로드
const downloadFile = async (file) => {
  try {
    await fileApi.downloadFile(file.id, file.file_name);
  } catch (error) {
    alert('파일 다운로드 중 오류가 발생했습니다.');
  }
};

// 액션 완료 핸들러
const handleActionCompleted = (action) => {
  loadDetail();
  emit('updated');
};

// 결재선 저장 핸들러
const handleApprovalLineSave = async (lines) => {
  try {
    await approvalStore.setApprovalLines(props.requestId, lines);
    showApprovalLineModal.value = false;
    await loadDetail();
  } catch (error) {
    alert('결재선 설정 중 오류가 발생했습니다: ' + error.message);
  }
};

// 유틸리티 함수들
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('ko-KR');
};


const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return FileText;
  }
  return File;
};

const formatFileSize = (bytes) => {
  return approvalUtils.formatFileSize(bytes);
};

// 모달 닫기
const closeModal = () => {
  approvalStore.clearState();
  emit('close');
};

// 감시자
watch(() => props.isVisible, (newValue) => {
  if (newValue && props.requestId) {
    loadDetail();
  }
});

watch(() => props.requestId, (newValue) => {
  if (newValue && props.isVisible) {
    loadDetail();
  }
});
</script>