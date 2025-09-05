<template>
  <div class="space-y-4">
    <h4 class="text-md font-semibold text-gray-900">결재 진행 현황</h4>
    
    <div v-if="loading" class="flex justify-center py-4">
      <Loader class="w-6 h-6 animate-spin text-blue-600" />
    </div>
    
    <div v-else-if="approvalLines.length === 0" class="text-gray-500 text-center py-4">
      결재선이 설정되지 않았습니다.
    </div>
    
    <div v-else class="space-y-4">
      <!-- 결재선 카드 표시 -->
      <div class="flex items-center space-x-3 overflow-x-auto pb-2 pt-3 px-3">
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
      
      <!-- 결재 이력 -->
      <div v-if="history.length > 0" class="mt-6">
        <h5 class="text-sm font-semibold text-gray-900 mb-3">결재 이력</h5>
        <div class="space-y-3">
          <div
            v-for="item in history"
            :key="item.id"
            class="bg-gray-50 rounded-md border border-gray-200"
          >
            <!-- 기본 이력 정보 -->
            <div class="p-3">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <div class="font-medium">{{ item.approver_name }}</div>
                    <span
                      class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                      :class="getActionBadgeClass(item.action)"
                    >
                      {{ getActionLabel(item.action) }}
                    </span>
                  </div>
                  
                  <div v-if="item.comment" class="text-sm text-gray-700 mt-2 p-2 bg-white rounded border-l-4 border-blue-200">
                    "{{ item.comment }}"
                  </div>
                </div>
                
                <div class="text-right ml-4">
                  <div class="text-xs text-gray-500">
                    {{ formatDetailedDate(item.created_at) }}
                  </div>
                  <button
                    @click="toggleDetails(item.id)"
                    class="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    {{ expandedDetails[item.id] ? '간단히' : '상세정보' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 법적 증명 상세 정보 (확장 가능) -->
            <div
              v-if="false && expandedDetails[item.id]"
              class="px-3 pb-3 border-t border-gray-200 bg-gray-25 dark:bg-gray-800"
            >
              <div class="pt-3">
                <h6 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Shield class="h-3 w-3 mr-1" />
                  법적 증명 정보
                </h6>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <!-- 신원 확인 정보 -->
                  <div class="space-y-2">
                    <div class="font-medium text-gray-600 dark:text-gray-400">신원 확인</div>
                    <div class="space-y-1 pl-2 border-l-2 border-blue-200">
                      <div class="flex justify-between">
                        <span class="text-gray-500">결재자 ID:</span>
                        <code class="font-mono text-gray-700 dark:text-gray-300">{{ item.approver_id }}</code>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">IP 주소:</span>
                        <code class="font-mono text-gray-700 dark:text-gray-300">
                          {{ item.ip_address || '기록되지 않음' }}
                        </code>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">사용자 에이전트:</span>
                        <span class="text-gray-700 dark:text-gray-300 text-right max-w-40 truncate" 
                              :title="item.user_agent">
                          {{ item.user_agent || '기록되지 않음' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 시간 증명 정보 -->
                  <div class="space-y-2">
                    <div class="font-medium text-gray-600 dark:text-gray-400">시간 증명</div>
                    <div class="space-y-1 pl-2 border-l-2 border-green-200">
                      <div class="flex justify-between">
                        <span class="text-gray-500">정확한 시각:</span>
                        <span class="text-gray-700 dark:text-gray-300">{{ formatPreciseTime(item.created_at) }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">타임스탬프:</span>
                        <code class="font-mono text-gray-700 dark:text-gray-300">{{ getTimestamp(item.created_at) }}</code>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">서버 시간대:</span>
                        <span class="text-gray-700 dark:text-gray-300">KST (UTC+9)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 법적 효력 안내 -->
                <div class="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-xs">
                  <div class="flex items-start space-x-2">
                    <Scale class="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div class="text-amber-800 dark:text-amber-200">
                      <div class="font-medium">법적 효력</div>
                      <div class="mt-1">
                        이 결재 기록은 전자문서법 제4조에 따라 법적 증명력을 가지며,
                        IP 주소, 시간 정보 등이 신원 확인의 근거로 활용됩니다.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Clock, Check, X, Pause, Loader, ArrowRight, Shield, Scale } from 'lucide-vue-next';
import { APPROVAL_STATUS, APPROVAL_ACTION } from '@/stores/useTypeStore';

const props = defineProps({
  requestId: {
    type: String,
    required: true,
  },
  approvalLines: {
    type: Array,
    default: () => [],
  },
  currentStep: {
    type: Number,
    default: 0,
  },
  histories: {
    type: Array,
    default: () => [],
  },
});

// 상태 관리 - props에서 직접 histories 사용
const loading = ref(false);
const expandedDetails = ref({}); // 확장된 상세 정보 추적

// 결재 이력은 props에서 직접 받아옴 (상세조회 API의 histories 필드)
const history = computed(() => props.histories || []);

// 단계별 스타일링
const getLineStatusClass = (line) => {
  if (line.step_order < props.currentStep) {
    return 'border-green-200 bg-green-50';
  } else if (line.step_order === props.currentStep) {
    return 'border-blue-200 bg-blue-50';
  } else {
    return 'border-gray-200 bg-gray-50';
  }
};

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

// 액션 배지 클래스
const getActionBadgeClass = (action) => {
  switch (action) {
    case APPROVAL_ACTION.APPROVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case APPROVAL_ACTION.REJECT:
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case APPROVAL_ACTION.SUBMIT:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case APPROVAL_ACTION.RECALL:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

// 상세 정보 토글
const toggleDetails = (historyId) => {
  expandedDetails.value[historyId] = !expandedDetails.value[historyId];
};

// 날짜 포맷팅
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

// 상세 날짜 포맷팅 (법적 증명용)
const formatDetailedDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });
};

// 정밀한 시간 포맷팅
const formatPreciseTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
};

// 타임스탬프 생성
const getTimestamp = (dateString) => {
  if (!dateString) return '';
  return Math.floor(new Date(dateString).getTime() / 1000);
};

// 별도의 API 호출이 필요 없음 - props에서 histories 직접 사용
</script>