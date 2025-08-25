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

        <!-- 결재선 및 진행 현황 -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-3">결재 진행 현황</h4>
          <div v-if="approvalLines.length === 0" class="text-gray-500 text-center py-4">
            결재선이 설정되지 않았습니다.
          </div>
          <div v-else class="flex items-center space-x-3 overflow-x-auto pb-2 pt-3 px-3">
            <div
              v-for="(line, index) in approvalLines"
              :key="`${line.approver_id}-${index}`"
              class="flex items-center space-x-3 flex-shrink-0"
            >
              <!-- 결재자 카드 -->
              <div class="relative group bg-white rounded-lg p-3 min-w-[160px] border-2" :class="getCardBorderClass(line)">
                <!-- 순서 배지 -->
                <div class="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" :class="getStepCircleClass(line)">
                  <component 
                    :is="getStepIcon(line)" 
                    class="w-3 h-3"
                    v-if="getStepIcon(line)"
                  />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                
                <!-- 결재자 정보 -->
                <div class="text-center">
                  <div class="font-medium text-gray-900">{{ line.approver_name || '알 수 없음' }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ line.approver_id }}</div>
                  <div class="text-xs text-gray-400">{{ line.approver_department }}</div>
                </div>
                
                <!-- 상태 표시 -->
                <div class="mt-2 text-center">
                  <div class="text-xs font-medium" :class="getStatusTextClass(line.status)">
                    {{ getStatusLabel(line.status) }}
                  </div>
                  <div v-if="line.approved_at" class="text-xs text-gray-400 mt-1">
                    {{ formatDate(line.approved_at) }}
                  </div>
                </div>
                
                <!-- 필수/선택 표시 -->
                <div v-if="!line.is_required" class="absolute top-1 right-1">
                  <span class="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">선택</span>
                </div>
              </div>
              
              <!-- 화살표 (마지막이 아닌 경우) -->
              <ArrowRight v-if="index < approvalLines.length - 1" class="w-5 h-5 text-gray-400 flex-shrink-0" />
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

        <!-- 첨부파일 -->
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-semibold text-gray-900">첨부파일</h4>
            <button
              v-if="attachedFiles.length > 1"
              @click="downloadAllFiles"
              :disabled="downloadingAll"
              class="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
            >
              <Loader v-if="downloadingAll" class="w-4 h-4 mr-1 animate-spin" />
              <Download v-else class="w-4 h-4 mr-1" />
              전체 다운로드 (ZIP)
            </button>
          </div>
          <div v-if="attachedFiles.length > 0" class="space-y-2">
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
          <div v-else class="text-gray-500 text-sm">
            첨부파일이 없습니다.
          </div>
        </div>

        <!-- 결재 의견 -->
        <div v-if="(request.histories && request.histories.length > 0)" class="border-t pt-6">
          <h4 class="font-semibold text-gray-900 mb-3">결재 의견</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-1/6">
                    결재자
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-1/6">
                    결재 상태
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-1/6">
                    일시
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b w-1/2">
                    결재 의견
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="item in request.histories"
                  :key="item.id"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-gray-900">{{ item.approver_name }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full" :class="getActionBadgeClass(item.action)">
                      {{ getActionLabel(item.action) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(item.created_at) }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    <div v-if="item.comment" class="break-words">
                      {{ item.comment }}
                    </div>
                    <div v-else class="text-gray-400 italic">
                      -
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
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
import { X, Loader, Download, FileText, File, Clock, Check, ArrowRight } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { fileApi, approvalUtils } from '@/utils/approvalApi';
import { APPROVAL_STATUS, APPROVAL_ACTION } from '@/stores/useTypeStore';
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
const downloadingAll = ref(false);

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

// 전체 파일 다운로드 (ZIP)
const downloadAllFiles = async () => {
  if (attachedFiles.value.length === 0) return;
  
  downloadingAll.value = true;
  try {
    await fileApi.downloadAllFiles(props.requestId, `결재첨부파일_${request.value.document_number}`);
  } catch (error) {
    alert('파일 일괄 다운로드 중 오류가 발생했습니다: ' + error.message);
  } finally {
    downloadingAll.value = false;
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

// 결재선 스타일링 함수들
const getCardBorderClass = (line) => {
  switch (line.status) {
    case APPROVAL_STATUS.APPROVED:
      return 'border-green-200';
    case APPROVAL_STATUS.REJECTED:
      return 'border-red-200';
    case APPROVAL_STATUS.IN_PROGRESS:
      return 'border-blue-200';
    default:
      return 'border-gray-200';
  }
};

const getStepCircleClass = (line) => {
  switch (line.status) {
    case APPROVAL_STATUS.APPROVED:
      return 'bg-green-100 text-green-800';
    case APPROVAL_STATUS.REJECTED:
      return 'bg-red-100 text-red-800';
    case APPROVAL_STATUS.IN_PROGRESS:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getStepIcon = (line) => {
  switch (line.status) {
    case APPROVAL_STATUS.APPROVED:
      return Check;
    case APPROVAL_STATUS.REJECTED:
      return X;
    case APPROVAL_STATUS.IN_PROGRESS:
      return Clock;
    default:
      return null;
  }
};

const getStatusTextClass = (status) => {
  switch (status) {
    case APPROVAL_STATUS.APPROVED:
      return 'text-green-600';
    case APPROVAL_STATUS.REJECTED:
      return 'text-red-600';
    case APPROVAL_STATUS.IN_PROGRESS:
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case APPROVAL_STATUS.PENDING:
      return '대기';
    case APPROVAL_STATUS.IN_PROGRESS:
      return '진행중';
    case APPROVAL_STATUS.APPROVED:
      return '승인';
    case APPROVAL_STATUS.REJECTED:
      return '반려';
    default:
      return '알 수 없음';
  }
};

const getActionLabel = (action) => {
  switch (action) {
    case APPROVAL_ACTION.APPROVE:
      return '승인';
    case APPROVAL_ACTION.REJECT:
      return '반려';
    case APPROVAL_ACTION.SUBMIT:
      return '상신';
    case APPROVAL_ACTION.RECALL:
      return '회수';
    default:
      return action;
  }
};

const getActionBadgeClass = (action) => {
  switch (action) {
    case APPROVAL_ACTION.APPROVE:
      return 'bg-green-100 text-green-800';
    case APPROVAL_ACTION.REJECT:
      return 'bg-red-100 text-red-800';
    case APPROVAL_ACTION.SUBMIT:
      return 'bg-blue-100 text-blue-800';
    case APPROVAL_ACTION.RECALL:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// 모달 닫기
const closeModal = () => {
  approvalStore.clearState();
  emit('close');
};

// 감시자 - 중복 호출 방지를 위해 조건부 통합
watch(
  () => [props.isVisible, props.requestId],
  ([isVisible, requestId]) => {
    if (isVisible && requestId) {
      loadDetail();
    }
  }
);
</script>