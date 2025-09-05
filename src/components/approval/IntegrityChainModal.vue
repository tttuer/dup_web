<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="closeModal"
  >
    <div class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white dark:bg-gray-900">
      <!-- 헤더 -->
      <div class="flex items-center justify-between border-b p-6 dark:border-gray-700">
        <div class="flex items-center space-x-2">
          <Shield class="h-6 w-6 text-blue-600" />
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">무결성 체인</h3>
        </div>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X class="h-6 w-6" />
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="flex justify-center py-12">
        <Loader class="h-8 w-8 animate-spin text-blue-600" />
      </div>

      <!-- 체인 내용 -->
      <div v-else-if="chain && chain.length > 0" class="p-6">
        <!-- 체인 개요 -->
        <div class="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
          <h4 class="mb-2 font-medium text-blue-900 dark:text-blue-100">체인 정보</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-blue-700 dark:text-blue-300 font-medium">총 기록 수:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">{{ chain.length }}개</span>
            </div>
            <div>
              <span class="text-blue-700 dark:text-blue-300 font-medium">최초 생성:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">
                {{ formatDate(chain[0]?.created_at) }}
              </span>
            </div>
            <div>
              <span class="text-blue-700 dark:text-blue-300 font-medium">최종 업데이트:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">
                {{ formatDate(chain[chain.length - 1]?.created_at) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 체인 기록들 -->
        <div class="space-y-4">
          <h4 class="font-medium text-gray-900 dark:text-gray-100">체인 기록</h4>
          
          <div class="relative">
            <!-- 체인 연결선 -->
            <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>
            
            <!-- 각 체인 항목 -->
            <div 
              v-for="(item, index) in chain" 
              :key="item.id"
              class="relative flex items-start space-x-4 pb-6"
            >
              <!-- 체인 노드 아이콘 -->
              <div 
                :class="[
                  'flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white dark:bg-gray-900',
                  item.is_valid 
                    ? 'border-green-200 dark:border-green-800' 
                    : 'border-red-200 dark:border-red-800'
                ]"
              >
                <component 
                  :is="item.is_valid ? CheckCircle : XCircle"
                  :class="[
                    'h-6 w-6',
                    item.is_valid 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  ]"
                />
              </div>

              <!-- 체인 정보 -->
              <div class="flex-1 min-w-0">
                <div class="rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
                  <!-- 기본 정보 -->
                  <div class="mb-3">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        체인 #{{ index + 1 }}
                      </span>
                      <span 
                        :class="[
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          item.is_valid
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        ]"
                      >
                        {{ item.is_valid ? '유효' : '무효' }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDate(item.created_at) }}
                    </p>
                  </div>

                  <!-- 해시 정보 -->
                  <div class="space-y-2 text-xs">
                    <div>
                      <span class="font-medium text-gray-700 dark:text-gray-300">현재 해시:</span>
                      <code class="ml-2 font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {{ truncateHash(item.document_hash) }}
                      </code>
                      <button
                        @click="copyToClipboard(item.document_hash)"
                        class="ml-2 text-blue-600 hover:text-blue-800"
                        title="복사"
                      >
                        <Copy class="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div v-if="item.previous_hash">
                      <span class="font-medium text-gray-700 dark:text-gray-300">이전 해시:</span>
                      <code class="ml-2 font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {{ truncateHash(item.previous_hash) }}
                      </code>
                      <button
                        @click="copyToClipboard(item.previous_hash)"
                        class="ml-2 text-blue-600 hover:text-blue-800"
                        title="복사"
                      >
                        <Copy class="h-3 w-3" />
                      </button>
                    </div>

                    <!-- 체인 연결 검증 -->
                    <div v-if="index > 0" class="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <component 
                        :is="isChainLinked(item, chain[index - 1]) ? Link : Unlink"
                        :class="[
                          'h-3 w-3',
                          isChainLinked(item, chain[index - 1]) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        ]"
                      />
                      <span 
                        :class="[
                          'text-xs',
                          isChainLinked(item, chain[index - 1])
                            ? 'text-green-600'
                            : 'text-red-600'
                        ]"
                      >
                        {{ isChainLinked(item, chain[index - 1]) ? '이전 기록과 연결됨' : '체인 끊어짐' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 체인이 없는 경우 -->
      <div v-else-if="!loading" class="p-12 text-center">
        <Shield class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          무결성 체인 없음
        </h4>
        <p class="text-gray-500 dark:text-gray-400">
          아직 무결성 기록이 생성되지 않았습니다.
        </p>
      </div>

      <!-- 에러 상태 -->
      <div v-if="error" class="p-6">
        <div class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div class="flex items-center space-x-2">
            <AlertTriangle class="h-5 w-5 text-red-600" />
            <span class="text-sm text-red-700 dark:text-red-400">{{ error }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { 
  Shield, X, CheckCircle, XCircle, Loader, AlertTriangle, 
  Copy, Link, Unlink 
} from 'lucide-vue-next';
import { useIntegrityStore } from '@/stores/useIntegrityStore';
import { useToast } from 'vue-toastification';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  requestId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(['close']);

const integrityStore = useIntegrityStore();
const toast = useToast();

// 계산된 속성
const loading = computed(() => integrityStore.loading);
const error = computed(() => integrityStore.error);
const chain = computed(() => integrityStore.getIntegrityChain(props.requestId));

// 모달이 열릴 때 체인 조회
watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.requestId) {
    try {
      await integrityStore.fetchIntegrityChain(props.requestId);
    } catch (err) {
      console.error('체인 조회 실패:', err);
    }
  }
});

// 모달 닫기
function closeModal() {
  emit('close');
}

// 해시값 축약 표시
function truncateHash(hash) {
  if (!hash) return '';
  return hash.length > 32 ? `${hash.substring(0, 16)}...${hash.substring(hash.length - 16)}` : hash;
}

// 클립보드에 복사
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('클립보드에 복사되었습니다');
  } catch (err) {
    console.error('복사 실패:', err);
    toast.error('복사에 실패했습니다');
  }
}

// 체인 연결 확인
function isChainLinked(currentItem, previousItem) {
  if (!currentItem || !previousItem) return false;
  return currentItem.previous_hash === previousItem.document_hash;
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
    second: '2-digit',
  });
}
</script>