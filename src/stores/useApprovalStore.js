// src/stores/useApprovalStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authFetch } from '@/utils/authFetch';
import { DOCUMENT_STATUS, APPROVAL_STATUS } from '@/stores/useTypeStore';

const APPROVAL_API_URL = import.meta.env.VITE_APPROVAL_API_URL;

export const useApprovalStore = defineStore('approval', () => {
  // 상태 관리
  const myApprovalRequests = ref([]);
  const pendingApprovals = ref([]);
  const approvalDetail = ref(null);
  const approvalLines = ref([]);
  const approvalHistory = ref([]);
  const attachedFiles = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 내가 기안한 결재 목록 조회
  async function fetchMyApprovalRequests() {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(APPROVAL_API_URL);
      if (response.ok) {
        const data = await response.json();
        myApprovalRequests.value = data;
      } else {
        throw new Error('결재 목록 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 목록 조회 오류:', err);
    } finally {
      loading.value = false;
    }
  }

  // 내가 결재할 요청 목록 조회
  async function fetchPendingApprovals() {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(APPROVAL_API_URL + '/pending');
      if (response.ok) {
        const data = await response.json();
        pendingApprovals.value = data;
      } else {
        throw new Error('대기 결재 목록 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('대기 결재 목록 조회 오류:', err);
    } finally {
      loading.value = false;
    }
  }

  // 결재 상세 조회
  async function fetchApprovalDetail(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${id}`);
      if (response.ok) {
        const data = await response.json();
        approvalDetail.value = data;
        return data;
      } else {
        throw new Error('결재 상세 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 상세 조회 오류:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 결재선 조회
  async function fetchApprovalLines(requestId) {
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${requestId}/lines`);
      if (response.ok) {
        const data = await response.json();
        approvalLines.value = data;
        return data;
      } else {
        throw new Error('결재선 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재선 조회 오류:', err);
      return [];
    }
  }

  // 결재 요청 생성
  async function createApprovalRequest(requestData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(APPROVAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchMyApprovalRequests(); // 목록 새로고침
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '결재 요청 생성 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 요청 생성 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 결재 상신
  async function submitApproval(requestId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${requestId}/submit`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchMyApprovalRequests(); // 목록 새로고침
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '결재 상신 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 상신 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 결재 승인
  async function approveRequest(requestId, comment = '') {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (response.ok) {
        await fetchPendingApprovals(); // 대기 목록 새로고침
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '결재 승인 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 승인 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 결재 반려
  async function rejectRequest(requestId, comment) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (response.ok) {
        await fetchPendingApprovals(); // 대기 목록 새로고침
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '결재 반려 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 반려 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 결재 회수
  async function recallRequest(requestId) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${requestId}/cancel`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchMyApprovalRequests(); // 목록 새로고침
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '결재 회수 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재 회수 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 결재선 설정
  async function setApprovalLines(requestId, lines) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${APPROVAL_API_URL}/${requestId}/lines`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approval_lines: lines }),
      });
      
      if (response.ok) {
        await fetchApprovalLines(requestId); // 결재선 새로고침
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '결재선 설정 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재선 설정 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 권한 체크 함수들
  const canApprove = computed(() => {
    return (requestId, currentUser) => {
      const lines = approvalLines.value;
      const detail = approvalDetail.value;
      
      if (!detail || !lines || detail.status !== DOCUMENT_STATUS.IN_PROGRESS) {
        return false;
      }
      
      // 현재 단계의 결재자인지 확인
      const currentStepLines = lines.filter(line => 
        line.step_order === detail.current_step && 
        line.status === APPROVAL_STATUS.PENDING
      );
      
      return currentStepLines.some(line => line.approver_id === currentUser.id);
    };
  });

  const canRecall = computed(() => {
    return (requestId, currentUser) => {
      const detail = approvalDetail.value;
      return detail && 
             detail.requester_id === currentUser.id && 
             [DOCUMENT_STATUS.SUBMITTED, DOCUMENT_STATUS.IN_PROGRESS].includes(detail.status);
    };
  });

  // 상태 초기화
  function clearState() {
    approvalDetail.value = null;
    approvalLines.value = [];
    approvalHistory.value = [];
    attachedFiles.value = [];
    error.value = null;
  }

  return {
    // 상태
    myApprovalRequests,
    pendingApprovals,
    approvalDetail,
    approvalLines,
    approvalHistory,
    attachedFiles,
    loading,
    error,
    
    // 액션
    fetchMyApprovalRequests,
    fetchPendingApprovals,
    fetchApprovalDetail,
    fetchApprovalLines,
    createApprovalRequest,
    submitApproval,
    approveRequest,
    rejectRequest,
    recallRequest,
    setApprovalLines,
    clearState,
    
    // 계산된 속성
    canApprove,
    canRecall,
  };
});