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
            class="p-3 bg-gray-50 rounded-md"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium">{{ item.approver_name }}</div>
                <div class="text-sm text-gray-600">{{ getActionLabel(item.action) }}</div>
                <div v-if="item.comment" class="text-sm text-gray-700 mt-1">
                  "{{ item.comment }}"
                </div>
              </div>
              <div class="text-xs text-gray-500">
                {{ formatDate(item.created_at) }}
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
import { Clock, Check, X, Pause, Loader, ArrowRight } from 'lucide-vue-next';
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

// 별도의 API 호출이 필요 없음 - props에서 histories 직접 사용
</script>