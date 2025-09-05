<template>
  <div class="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
    <!-- 헤더 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center space-x-2">
        <Shield class="h-5 w-5 text-blue-600" />
        <h4 class="font-medium text-gray-900 dark:text-gray-100">문서 무결성</h4>
      </div>
      <button
        v-if="!loading"
        @click="handleVerify"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        :disabled="loading"
      >
        검증하기
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="flex items-center justify-center py-4">
      <Loader class="h-5 w-5 animate-spin text-blue-600 mr-2" />
      <span class="text-sm text-gray-600 dark:text-gray-400">검증 중...</span>
    </div>

    <!-- 무결성 상태 -->
    <div v-else-if="integrityStatus" class="space-y-3">
      <!-- 전체 상태 -->
      <div class="flex items-center space-x-2">
        <component 
          :is="integrityStatus.isValid ? CheckCircle : XCircle"
          :class="[
            'h-5 w-5',
            integrityStatus.isValid 
              ? 'text-green-600' 
              : 'text-red-600'
          ]"
        />
        <span 
          :class="[
            'font-medium text-sm',
            integrityStatus.isValid 
              ? 'text-green-700 dark:text-green-400' 
              : 'text-red-700 dark:text-red-400'
          ]"
        >
          {{ integrityStatus.isValid ? '무결성 확인됨' : '무결성 위반 감지' }}
        </span>
      </div>

      <!-- 상세 정보 -->
      <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <div>
          <span class="font-medium">메시지:</span> {{ integrityStatus.message }}
        </div>
        <div v-if="integrityStatus.lastChecked">
          <span class="font-medium">최종 검증:</span> 
          {{ formatDate(integrityStatus.lastChecked) }}
        </div>
        <div v-if="integrityStatus.hashValue">
          <span class="font-medium">해시값:</span> 
          <code class="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">
            {{ truncateHash(integrityStatus.hashValue) }}
          </code>
        </div>
      </div>

      <!-- 체인 검증 상태 -->
      <div v-if="integrityStatus.chainValid !== undefined" class="flex items-center space-x-2">
        <component 
          :is="integrityStatus.chainValid ? CheckCircle : XCircle"
          :class="[
            'h-4 w-4',
            integrityStatus.chainValid 
              ? 'text-green-500' 
              : 'text-red-500'
          ]"
        />
        <span class="text-xs text-gray-600 dark:text-gray-400">
          {{ integrityStatus.chainValid ? '체인 무결성 확인' : '체인 무결성 위반' }}
        </span>
      </div>

      <!-- 액션 버튼들 -->
      <div class="flex space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
        <button
          @click="showChainModal"
          class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
        >
          체인 보기
        </button>
        <button
          v-if="canCreateIntegrity"
          @click="createIntegrity"
          class="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800"
        >
          {{ integrityStatus ? '무결성 재생성' : '무결성 기록 생성' }}
        </button>
      </div>
    </div>

    <!-- 초기 상태 -->
    <div v-else class="text-center py-4">
      <Shield class="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        결재 완료 후 문서 무결성 검증이 가능합니다
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        '검증하기'를 클릭하여 문서의 위변조 여부를 확인하세요
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

  <!-- 무결성 체인 모달 -->
  <IntegrityChainModal
    v-if="showChain"
    :visible="showChain"
    :requestId="requestId"
    @close="showChain = false"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Shield, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-vue-next';
import { useIntegrityStore } from '@/stores/useIntegrityStore';
import IntegrityChainModal from './IntegrityChainModal.vue';

const props = defineProps({
  requestId: {
    type: [String, Number],
    required: true,
  },
  autoVerify: {
    type: Boolean,
    default: false,
  },
  canCreateIntegrity: {
    type: Boolean,
    default: false,
  },
});

const integrityStore = useIntegrityStore();
const showChain = ref(false);

// 계산된 속성
const loading = computed(() => integrityStore.loading);
const error = computed(() => integrityStore.error);
const integrityStatus = computed(() => integrityStore.getIntegrityStatus(props.requestId));

// 무결성 검증
async function handleVerify() {
  try {
    await integrityStore.verifyIntegrity(props.requestId);
  } catch (err) {
    console.error('무결성 검증 실패:', err);
  }
}

// 무결성 기록 생성
async function createIntegrity() {
  try {
    await integrityStore.createIntegrityRecord(props.requestId);
  } catch (err) {
    console.error('무결성 기록 생성 실패:', err);
  }
}

// 체인 모달 표시
function showChainModal() {
  showChain.value = true;
}

// 해시값 축약 표시
function truncateHash(hash) {
  if (!hash) return '';
  return hash.length > 16 ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}` : hash;
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

// 컴포넌트 마운트 시 자동 검증
onMounted(async () => {
  if (props.autoVerify) {
    await handleVerify();
  }
});
</script>