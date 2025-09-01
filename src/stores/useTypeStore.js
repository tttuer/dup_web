// src/stores/useTypeStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const TYPE = {
  VOUCHER: 'VOUCHER',
  EXTRA: 'EXTRA',
};

// 전자결재 상태 타입
export const APPROVAL_STATUS = {
  PENDING: 'PENDING',       // 결재 대기
  IN_PROGRESS: 'IN_PROGRESS', // 결재 진행중
  APPROVED: 'APPROVED',     // 결재 완료
  REJECTED: 'REJECTED',     // 결재 반려
  RECALLED: 'RECALLED'      // 결재 회수
};

export const DOCUMENT_STATUS = {
  SUBMITTED: 'SUBMITTED',   // 상신완료
  IN_PROGRESS: 'IN_PROGRESS', // 결재진행중
  APPROVED: 'APPROVED',     // 승인완료
  REJECTED: 'REJECTED',     // 반려
};

export const APPROVAL_ACTION = {
  SUBMIT: 'SUBMIT',         // 상신
  APPROVE: 'APPROVE',       // 승인
  REJECT: 'REJECT',         // 반려
  RECALL: 'RECALL',         // 회수
  DELEGATE: 'DELEGATE'      // 위임
};


const typeLabelMap = {
  [TYPE.VOUCHER]: '전표 증빙자료',
  [TYPE.EXTRA]: '그 외',
};

// 결재 상태 라벨 맵
export const APPROVAL_STATUS_LABELS = {
  [APPROVAL_STATUS.PENDING]: '결재 대기',
  [APPROVAL_STATUS.IN_PROGRESS]: '결재 진행중',
  [APPROVAL_STATUS.APPROVED]: '결재 완료',
  [APPROVAL_STATUS.REJECTED]: '결재 반려',
  [APPROVAL_STATUS.RECALLED]: '결재 회수'
};

export const DOCUMENT_STATUS_LABELS = {
  [DOCUMENT_STATUS.SUBMITTED]: '상신완료',
  [DOCUMENT_STATUS.IN_PROGRESS]: '결재진행중',
  [DOCUMENT_STATUS.APPROVED]: '승인완료',
  [DOCUMENT_STATUS.REJECTED]: '반려',
};

export const useTypeStore = defineStore('type', () => {
  const currentType = ref('');

  function setType(type) {
    currentType.value = type;
  }

  const currentTypeLabel = computed(() => typeLabelMap[currentType.value] || '');

  return {
    currentType,
    setType,
    currentTypeLabel,
  };
});
