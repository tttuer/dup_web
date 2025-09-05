<template>
  <div class="border rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <Scale class="h-5 w-5 text-amber-600" />
        <h4 class="font-medium text-amber-900 dark:text-amber-100">법적 문서</h4>
        <span class="bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full text-xs font-medium">
          법적 효력 보장
        </span>
      </div>
      <button
        v-if="!loading && documentExists"
        @click="handleDownload"
        class="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
        :disabled="loading"
      >
        <Download class="h-4 w-4" />
        <span>원본 PDF 다운로드</span>
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <Loader class="h-5 w-5 animate-spin text-amber-600 mr-2" />
      <span class="text-sm text-amber-700 dark:text-amber-300">법적 문서 처리 중...</span>
    </div>

    <!-- 문서 존재 시 -->
    <div v-else-if="documentExists" class="space-y-3">
      <div class="flex items-center space-x-2">
        <CheckCircle class="h-5 w-5 text-green-600" />
        <span class="font-medium text-amber-800 dark:text-amber-200">법적 효력 있는 원본 문서가 보관되어 있습니다</span>
      </div>

      <div class="text-sm text-amber-700 dark:text-amber-300 space-y-1">
        <p>• 결재 완료 시점의 원본 문서를 PDF 형태로 영구 보존</p>
        <p>• 전자문서법 제4조에 따른 법적 증명력 보장</p>
        <p>• SHA-256 해시 기반 무결성 검증으로 위변조 방지</p>
        <p>• 결재 완료 후 자동 생성되어 변경 불가능한 상태로 보관</p>
        <p v-if="createdAt">• 보관일: {{ formatDate(createdAt) }}</p>
      </div>

      <div class="pt-2 border-t border-amber-200 dark:border-amber-700">
        <p class="text-xs text-amber-600 dark:text-amber-400">
          ⚖️ 이 문서는 전자문서법 제4조에 따라 법적 효력을 갖습니다.
        </p>
      </div>
    </div>

    <!-- 문서 아직 생성 안됨 -->
    <div v-else-if="!loading && documentExists === false" class="text-center py-6">
      <div class="mb-4">
        <FileText class="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h5 class="font-medium text-amber-900 dark:text-amber-100 mb-2">법적 문서 생성</h5>
        <p class="text-sm text-amber-700 dark:text-amber-300 mb-3">
          결재가 완료되었습니다. 법적 효력을 갖는 원본 문서를 생성하시겠습니까?
        </p>
      </div>

      <div class="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 mb-4 text-xs text-amber-800 dark:text-amber-200">
        <h6 class="font-medium mb-1">📋 법적 문서에 포함되는 내용:</h6>
        <ul class="space-y-1 text-left">
          <li>• 결재 요청 전체 내용 (제목, 내용, 첨부파일)</li>
          <li>• 완료된 결재선 및 모든 결재자 정보</li>
          <li>• 각 결재자의 승인 시간 및 IP 주소</li>
          <li>• SHA-256 해시값을 통한 무결성 보장</li>
        </ul>
      </div>

      <div class="flex justify-center">
        <button
          @click="createDocument"
          class="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2"
          :disabled="creating"
        >
          <Loader v-if="creating" class="h-4 w-4 animate-spin" />
          <FileText v-else class="h-4 w-4" />
          <span>{{ creating ? '법적 문서 생성 중...' : '법적 문서 생성하기' }}</span>
        </button>
      </div>

      <p class="text-xs text-amber-600 dark:text-amber-400 mt-3">
        ⚖️ 생성된 문서는 전자문서법에 따라 법적 효력을 가지며 변경할 수 없습니다.
      </p>
    </div>

    <!-- 초기 상태 -->
    <div v-else class="text-center py-4">
      <Scale class="h-8 w-8 text-amber-400 mx-auto mb-2" />
      <p class="text-sm text-amber-600 dark:text-amber-400">
        법적 문서 상태를 확인하는 중...
      </p>
    </div>

    <!-- 에러 상태 -->
    <div v-if="error" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
      <div class="flex items-center space-x-2">
        <AlertTriangle class="h-4 w-4 text-red-600" />
        <span class="text-sm text-red-700 dark:text-red-400">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Scale, Download, CheckCircle, FileX, FileText, Loader, AlertTriangle } from 'lucide-vue-next';
import { useIntegrityStore } from '@/stores/useIntegrityStore';
import { useUserStore } from '@/stores/useUserStore';
import { useToast } from 'vue-toastification';

const props = defineProps({
  requestId: {
    type: [String, Number],
    required: true,
  },
  canCreateDocument: {
    type: Boolean,
    default: false,
  },
});

const integrityStore = useIntegrityStore();
const userStore = useUserStore();
const toast = useToast();

const loading = ref(false);
const creating = ref(false);
const error = ref(null);
const createdAt = ref(null);

// 계산된 속성
const documentExists = computed(() => integrityStore.isLegalDocumentAvailable(props.requestId));

// 문서 존재 여부 확인
async function checkDocumentExists() {
  loading.value = true;
  error.value = null;
  
  try {
    const exists = await integrityStore.checkLegalDocumentExists(props.requestId);
    if (exists && exists.created_at) {
      createdAt.value = exists.created_at;
    }
  } catch (err) {
    error.value = '문서 상태 확인 중 오류가 발생했습니다';
    console.error('문서 존재 확인 실패:', err);
  } finally {
    loading.value = false;
  }
}

// 법적 문서 다운로드
async function handleDownload() {
  try {
    const fileName = `legal_document_${props.requestId}.pdf`;
    await integrityStore.downloadLegalDocument(props.requestId, fileName);
    toast.success('법적 문서 다운로드가 완료되었습니다');
  } catch (err) {
    error.value = '다운로드 중 오류가 발생했습니다';
    toast.error('다운로드에 실패했습니다');
    console.error('다운로드 실패:', err);
  }
}

// 법적 문서 생성
async function createDocument() {
  creating.value = true;
  error.value = null;
  
  try {
    await integrityStore.createLegalDocument(props.requestId);
    toast.success('법적 문서가 생성되었습니다');
    await checkDocumentExists(); // 생성 후 상태 업데이트
  } catch (err) {
    error.value = '문서 생성 중 오류가 발생했습니다';
    toast.error('문서 생성에 실패했습니다');
    console.error('문서 생성 실패:', err);
  } finally {
    creating.value = false;
  }
}

// 날짜 포맷팅
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 컴포넌트 마운트 시 문서 존재 여부 확인
onMounted(async () => {
  await checkDocumentExists();
});
</script>