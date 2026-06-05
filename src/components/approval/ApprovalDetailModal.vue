<template>
  <div
    v-if="isVisible"
    class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
    @click.self="closeModal"
  >
    <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
      <!-- 헤더 -->
      <div class="flex items-center justify-between border-b p-6">
        <h3 class="text-xl font-semibold">결재 상세</h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader class="h-8 w-8 animate-spin text-blue-600" />
      </div>

      <!-- 콘텐츠 -->
      <div v-else-if="request" class="space-y-6 p-6">
        <!-- 기본 정보 -->
        <div class="grid grid-cols-1 gap-6">
          <div>
            <h4 class="mb-3 font-semibold text-gray-900">기본 정보</h4>
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
          <h4 class="mb-3 font-semibold text-gray-900">결재 진행 현황</h4>
          <div v-if="approvalLines.length === 0" class="py-4 text-center text-gray-500">
            결재선이 설정되지 않았습니다.
          </div>
          <div v-else class="flex items-center space-x-3 overflow-x-auto px-3 pt-3 pb-2">
            <div
              v-for="(line, index) in approvalLines"
              :key="`${line.approver_id}-${index}`"
              class="flex flex-shrink-0 items-center space-x-3"
            >
              <!-- 결재자 카드 -->
              <div
                class="group relative min-w-[160px] rounded-lg border-2 bg-white p-3"
                :class="getCardBorderClass(line)"
              >
                <!-- 순서 배지 -->
                <div
                  class="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                  :class="getStepCircleClass(line)"
                >
                  <component :is="getStepIcon(line)" class="h-3 w-3" v-if="getStepIcon(line)" />
                  <span v-else>{{ index + 1 }}</span>
                </div>

                <!-- 결재자 정보 -->
                <div class="text-center">
                  <div class="font-medium text-gray-900">
                    {{ line.approver_name || '알 수 없음' }}
                  </div>
                  <div class="mt-1 text-xs text-gray-500">{{ line.approver_id }}</div>
                  <div class="text-xs text-gray-400">{{ line.approver_department }}</div>
                </div>

                <!-- 상태 표시 -->
                <div class="mt-2 text-center">
                  <div class="text-xs font-medium" :class="getStatusTextClass(line.status)">
                    {{ getStatusLabel(line.status) }}
                  </div>
                  <div v-if="line.approved_at" class="mt-1 text-xs text-gray-400">
                    {{ formatDate(line.approved_at) }}
                  </div>
                </div>

                <!-- 필수/선택 표시 -->
                <div v-if="!line.is_required" class="absolute top-1 right-1">
                  <span class="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-600">선택</span>
                </div>
              </div>

              <!-- 화살표 (마지막이 아닌 경우) -->
              <ArrowRight
                v-if="index < approvalLines.length - 1"
                class="h-5 w-5 flex-shrink-0 text-gray-400"
              />
            </div>
          </div>
        </div>

        <!-- 제목 -->
        <div>
          <h4 class="mb-2 font-semibold text-gray-900">제목</h4>
          <p class="text-lg">{{ request.title }}</p>
        </div>

        <!-- 내용 -->
        <div>
          <h4 class="mb-2 font-semibold text-gray-900">내용</h4>
          <div class="prose max-w-none rounded-md bg-gray-50 p-4">
            <div class="prose max-w-none rounded-md bg-gray-50 p-4 whitespace-pre-wrap">
              {{ request.content }}
            </div>
          </div>
        </div>

        <!-- 첨부파일 (기안자) -->
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h4 class="font-semibold text-gray-900">첨부파일</h4>
            <button
              v-if="requesterFiles.length > 1"
              @click="downloadAllFiles"
              :disabled="downloadingAll"
              class="inline-flex items-center rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200 disabled:opacity-50"
            >
              <Loader v-if="downloadingAll" class="mr-1 h-4 w-4 animate-spin" />
              <Download v-else class="mr-1 h-4 w-4" />
              전체 다운로드 (ZIP)
            </button>
          </div>
          <div v-if="requesterFiles.length > 0" class="space-y-2">
            <div
              v-for="file in requesterFiles"
              :key="file.id"
              class="flex items-center justify-between rounded-md bg-gray-50 p-3"
            >
              <div class="flex items-center space-x-3">
                <component :is="getFileIcon(file.file_name)" class="h-5 w-5 text-gray-400" />
                <div>
                  <div class="font-medium">{{ file.file_name }}</div>
                  <div class="text-sm text-gray-500">{{ formatFileSize(file.file_size) }}</div>
                </div>
              </div>
              <button
                @click="downloadFile(file)"
                class="inline-flex items-center rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
              >
                <Download class="mr-1 h-4 w-4" />
                다운로드
              </button>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">첨부파일이 없습니다.</div>
        </div>

        <!-- 무결성 검증 섹션 -->
        <div v-if="false && showIntegritySection" class="border-t pt-6">
          <IntegrityVerificationWidget 
            :requestId="request.id"
            :autoVerify="isCompletedApproval"
            :canCreateIntegrity="canCreateIntegrity"
          />
        </div>

        <!-- 법적 문서 다운로드 -->
        <div v-if="false && showLegalDocumentSection" class="border-t pt-6">
          <LegalDocumentDownload :requestId="request.id" />
        </div>

        <!-- 결재 이력 및 의견 (타임라인) -->
        <div v-if="request.histories && request.histories.length > 0" class="border-t pt-6">
          <h4 class="mb-5 font-semibold text-gray-900">결재 이력 및 의견</h4>
          <div class="relative pl-6 ml-3 border-l-2 border-gray-200 space-y-6">
            <div v-for="item in request.histories" :key="item.id" class="relative">
              <!-- 타임라인 점 -->
              <div class="absolute -left-[31px] mt-1.5 h-4 w-4 rounded-full border-4 border-white shadow-sm" :class="getTimelineDotClass(item.action)"></div>
              
              <!-- 타임라인 카드 -->
              <div class="flex-1 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <span class="font-bold text-gray-900">{{ item.approver_name }}</span>
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="getActionBadgeClass(item.action)"
                    >
                      {{ getActionLabel(item.action) }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500">{{ formatDate(item.created_at) }}</span>
                </div>
                
                <!-- 코멘트 -->
                <div class="text-sm text-gray-700">
                  <div v-if="item.comment" class="break-words rounded bg-gray-50 p-3 whitespace-pre-wrap">
                    <div :class="expandedComments[item.id] ? '' : 'line-clamp-3'">{{ item.comment }}</div>
                    <button
                      v-if="item.comment && item.comment.length > 100"
                      @click="toggleComment(item.id)"
                      class="mt-1 text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      {{ expandedComments[item.id] ? '접기' : '더보기' }}
                    </button>
                  </div>
                  <div v-else class="text-gray-400 italic">의견이 없습니다.</div>
                </div>

                <!-- 해당 결재자의 첨부파일 -->
                <div v-if="getFilesForHistory(item).length > 0" class="mt-3 pt-3 border-t border-gray-100">
                  <div class="mb-2 flex items-center space-x-1 text-xs font-semibold text-gray-500">
                    <File class="h-3.5 w-3.5" />
                    <span>첨부파일</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="file in getFilesForHistory(item)"
                      :key="file.id"
                      class="flex items-center space-x-2 rounded border border-gray-200 bg-white px-2 py-1 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      <component :is="getFileIcon(file.file_name)" class="h-4 w-4 text-blue-500" />
                      <span class="text-xs font-medium text-gray-700 max-w-[150px] truncate" :title="file.file_name">{{ file.file_name }}</span>
                      <span class="text-[10px] text-gray-400">{{ formatFileSize(file.file_size) }}</span>
                      <button @click="downloadFile(file)" class="ml-1 rounded text-gray-400 hover:text-blue-600 focus:outline-none" title="다운로드">
                        <Download class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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
            @edit-document="emit('edit-document', $event)"
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
import { ref, computed, watch, onUnmounted } from 'vue';
import { X, Loader, Download, FileText, File, Clock, Check, ArrowRight } from 'lucide-vue-next';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import { fileApi, approvalUtils } from '@/utils/approvalApi';
import { APPROVAL_STATUS, APPROVAL_ACTION, DOCUMENT_STATUS } from '@/stores/useTypeStore';
import ApprovalStatus from './ApprovalStatus.vue';
import ApprovalHistory from './ApprovalHistory.vue';
import ApprovalActionButtons from './ApprovalActionButtons.vue';
import ApprovalLineModal from './ApprovalLineModal.vue';
import IntegrityVerificationWidget from './IntegrityVerificationWidget.vue';
import LegalDocumentDownload from './LegalDocumentDownload.vue';

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

const emit = defineEmits(['close', 'updated', 'edit-document']);

const approvalStore = useApprovalStore();
const userStore = useUserStore();

// 상태 관리
const loading = ref(false);
const showApprovalLineModal = ref(false);
const attachedFiles = ref([]);
const downloadingAll = ref(false);
const expandedComments = ref({}); // 펼쳐진 댓글들 추적

// 데이터
const request = computed(() => approvalStore.approvalDetail);
const approvalLines = computed(() => approvalStore.approvalLines);

// 첨부파일 필터링
const requesterFiles = computed(() => {
  return attachedFiles.value.filter(file => !isApproverFile(file));
});

const getFilesForHistory = (historyItem) => {
  if (!historyItem || !attachedFiles.value.length) return [];
  if (historyItem.files && historyItem.files.length > 0) return historyItem.files;
  
  return attachedFiles.value.filter(file => {
    if (!isApproverFile(file)) return false;
    const uploaderId = file.uploader_id || file.uploaded_by || file.created_by || file.user_id;
    return String(uploaderId) === String(historyItem.approver_id);
  });
};

// 무결성 및 법적 문서 섹션 표시 로직
const showIntegritySection = computed(() => {
  // 결재가 완료된 경우에만 무결성 검증 섹션 표시
  return request.value && request.value.status === DOCUMENT_STATUS.APPROVED;
});

const showLegalDocumentSection = computed(() => {
  return request.value && request.value.status === DOCUMENT_STATUS.APPROVED;
});

const isCompletedApproval = computed(() => {
  return request.value && request.value.status === DOCUMENT_STATUS.APPROVED;
});

const canCreateIntegrity = computed(() => {
  // 관리자이거나 결재 완료된 경우에만 무결성 기록 생성 가능
  return userStore.isAdmin || isCompletedApproval.value;
});

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
    await fileApi.downloadAllFiles(
      props.requestId,
      `결재첨부파일_${request.value.document_number}`,
    );
  } catch (error) {
    alert('파일 일괄 다운로드 중 오류가 발생했습니다: ' + error.message);
  } finally {
    downloadingAll.value = false;
  }
};

// 액션 완료 핸들러
const handleActionCompleted = (action) => {
  if (action === 'delete') {
    closeModal();
    emit('updated');
  } else {
    loadDetail();
    emit('updated');
  }
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
// 결재자 첨부 파일인지 확인
const isApproverFile = (file) => {
  if (!file) return false;
  
  // 백엔드에서 명시적 플래그를 주는 경우
  if (file.is_approver_attachment === true || file.is_approver === true) return true;
  if (file.uploader_type === 'APPROVER' || file.uploader_type === 'approver') return true;
  if (file.role === 'APPROVER' || file.role === 'approver') return true;
  
  // 기안자와 업로더가 다른 경우 결재자 첨부로 간주
  const requesterId = request.value?.requester_id;
  const uploaderId = file.uploader_id || file.uploaded_by || file.created_by || file.user_id;
  
  if (uploaderId && requesterId && String(uploaderId) !== String(requesterId)) {
    return true;
  }
  
  return false;
};

// 업로더 이름 가져오기
const getUploaderName = (file) => {
  if (!file) return '';
  return file.uploader_name || file.uploaded_by_name || file.created_by_name || file.user_name || '';
};

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

const getTimelineDotClass = (action) => {
  switch (action) {
    case APPROVAL_ACTION.APPROVE:
      return 'bg-green-500';
    case APPROVAL_ACTION.REJECT:
      return 'bg-red-500';
    case APPROVAL_ACTION.SUBMIT:
      return 'bg-blue-500';
    default:
      return 'bg-gray-400';
  }
};

// 코멘트 펼치기/접기
const toggleComment = (commentId) => {
  expandedComments.value[commentId] = !expandedComments.value[commentId];
};

// 모달 닫기
const closeModal = () => {
  approvalStore.clearState();
  expandedComments.value = {}; // 펼쳐진 상태 초기화
  emit('close');
};

// 감시자 - 중복 호출 방지를 위해 조건부 통합
watch(
  () => [props.isVisible, props.requestId],
  ([isVisible, requestId]) => {
    if (isVisible && requestId) {
      loadDetail();
    }
  },
);

// 모달 열림 상태에 따라 body 스크롤 방지
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
