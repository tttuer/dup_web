<template>
  <div class="flex items-center space-x-2">
    <!-- 상태 배지 -->
    <span 
      :class="[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusClasses
      ]"
    >
      <component 
        :is="statusIcon" 
        class="w-3 h-3 mr-1" 
        v-if="statusIcon"
      />
      {{ statusLabel }}
    </span>
    
    <!-- 진행률 표시 (진행중일 때만) -->
    <div 
      v-if="status === DOCUMENT_STATUS.IN_PROGRESS && approvalLines.length > 0"
      class="flex items-center space-x-1 text-sm text-gray-600"
    >
      <span>{{ currentStep }}/{{ totalSteps }}</span>
      <div class="w-16 bg-gray-200 rounded-full h-1.5">
        <div 
          class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Clock, FileText, CheckCircle, XCircle, RotateCcw, Pause } from 'lucide-vue-next';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABELS } from '@/stores/useTypeStore';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  currentStep: {
    type: Number,
    default: 0,
  },
  totalSteps: {
    type: Number,
    default: 0,
  },
  approvalLines: {
    type: Array,
    default: () => [],
  },
});

// 상태별 라벨
const statusLabel = computed(() => {
  return DOCUMENT_STATUS_LABELS[props.status] || props.status;
});

// 상태별 CSS 클래스
const statusClasses = computed(() => {
  switch (props.status) {
    case DOCUMENT_STATUS.DRAFT:
      return 'bg-gray-100 text-gray-800';
    case DOCUMENT_STATUS.SUBMITTED:
      return 'bg-blue-100 text-blue-800';
    case DOCUMENT_STATUS.IN_PROGRESS:
      return 'bg-yellow-100 text-yellow-800';
    case DOCUMENT_STATUS.APPROVED:
      return 'bg-green-100 text-green-800';
    case DOCUMENT_STATUS.REJECTED:
      return 'bg-red-100 text-red-800';
    case DOCUMENT_STATUS.CANCELLED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
});

// 상태별 아이콘
const statusIcon = computed(() => {
  switch (props.status) {
    case DOCUMENT_STATUS.DRAFT:
      return FileText;
    case DOCUMENT_STATUS.SUBMITTED:
      return Clock;
    case DOCUMENT_STATUS.IN_PROGRESS:
      return Clock;
    case DOCUMENT_STATUS.APPROVED:
      return CheckCircle;
    case DOCUMENT_STATUS.REJECTED:
      return XCircle;
    case DOCUMENT_STATUS.CANCELLED:
      return Pause;
    default:
      return null;
  }
});

// 진행률 계산
const progressPercentage = computed(() => {
  if (props.totalSteps === 0) return 0;
  return Math.round((props.currentStep / props.totalSteps) * 100);
});
</script>