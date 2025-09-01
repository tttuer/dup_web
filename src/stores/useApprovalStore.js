// src/stores/useApprovalStore.js
import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { authFetch } from '@/utils/authFetch';
import { DOCUMENT_STATUS, APPROVAL_STATUS } from '@/stores/useTypeStore';

const APPROVAL_API_URL = import.meta.env.VITE_APPROVAL_API_URL;

export const useApprovalStore = defineStore('approval', () => {
  // 상태 관리
  const myApprovalRequests = shallowRef([]);
  const pendingApprovals = shallowRef([]);
  const completedApprovals = shallowRef([]);
  const approvalDetail = ref(null);
  const approvalLines = shallowRef([]);
  const approvalHistory = shallowRef([]);
  const attachedFiles = shallowRef([]);
  const loading = ref(false);
  const error = ref(null);
  
  // 페이징 상태
  const currentPage = ref(1);
  const totalPage = ref(0);
  const pendingCurrentPage = ref(1);
  const pendingTotalPage = ref(0);
  const completedCurrentPage = ref(1);
  const completedTotalPage = ref(0);
  
  // 필터 파라미터 저장 (무한 스크롤 시 유지하기 위해)
  const lastMyApprovalParams = ref({});
  const lastPendingParams = ref({});
  const lastCompletedParams = ref({});

  // 내가 기안한 결재 목록 조회
  async function fetchMyApprovalRequests(params = {}, isReset = false) {
    loading.value = true;
    error.value = null;
    try {
      if (isReset) {
        myApprovalRequests.value = [];
        currentPage.value = 1;
        // 새로운 필터 파라미터 저장
        lastMyApprovalParams.value = { ...params };
      }

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      queryParams.append('page', currentPage.value);
      queryParams.append('page_size', 20);
      
      const url = `${APPROVAL_API_URL}?${queryParams.toString()}`;
        
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // 백엔드 응답 구조에 맞게 수정 (실제 응답 구조 확인 필요)
        if (Array.isArray(data)) {
          // 단순 배열 응답인 경우
          if (isReset) {
            myApprovalRequests.value = data;
          } else {
            myApprovalRequests.value = [...myApprovalRequests.value, ...data];
          }
          // 페이지 정보는 헤더나 별도 응답에서 가져와야 함
          totalPage.value = Math.ceil(data.length / 20); // 임시
        } else if (data.items) {
          // 페이징 정보 포함된 응답인 경우
          if (isReset) {
            myApprovalRequests.value = data.items;
          } else {
            myApprovalRequests.value = [...myApprovalRequests.value, ...data.items];
          }
          totalPage.value = data.total_pages;
        }
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
  async function fetchPendingApprovals(params = {}, isReset = false) {
    loading.value = true;
    error.value = null;
    try {
      if (isReset) {
        pendingApprovals.value = [];
        pendingCurrentPage.value = 1;
        // 새로운 필터 파라미터 저장
        lastPendingParams.value = { ...params };
      }

      const queryParams = new URLSearchParams();
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      queryParams.append('page', pendingCurrentPage.value);
      queryParams.append('page_size', 20);
      
      const url = `${APPROVAL_API_URL}/pending?${queryParams.toString()}`;
        
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // 백엔드 응답 구조에 맞게 수정
        if (Array.isArray(data)) {
          if (isReset) {
            pendingApprovals.value = data;
          } else {
            pendingApprovals.value = [...pendingApprovals.value, ...data];
          }
          pendingTotalPage.value = Math.ceil(data.length / 20); // 임시
        } else if (data.items) {
          if (isReset) {
            pendingApprovals.value = data.items;
          } else {
            pendingApprovals.value = [...pendingApprovals.value, ...data.items];
          }
          pendingTotalPage.value = data.total_pages;
        }
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

  // 완료된 결재 목록 조회
  async function fetchCompletedApprovals(params = {}, isReset = false) {
    loading.value = true;
    error.value = null;
    try {
      if (isReset) {
        completedApprovals.value = [];
        completedCurrentPage.value = 1;
        // 새로운 필터 파라미터 저장
        lastCompletedParams.value = { ...params };
      }

      const queryParams = new URLSearchParams();
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      queryParams.append('page', completedCurrentPage.value);
      queryParams.append('page_size', 20);
      
      const url = `${APPROVAL_API_URL}/completed?${queryParams.toString()}`;
        
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          if (isReset) {
            completedApprovals.value = data;
          } else {
            completedApprovals.value = [...completedApprovals.value, ...data];
          }
          completedTotalPage.value = Math.ceil(data.length / 20); // 임시
        } else if (data.items) {
          if (isReset) {
            completedApprovals.value = data.items;
          } else {
            completedApprovals.value = [...completedApprovals.value, ...data.items];
          }
          completedTotalPage.value = data.total_pages;
        }
      } else {
        throw new Error('완료 결재 목록 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('완료 결재 목록 조회 오류:', err);
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

  // 결재 요청 생성 (파일 포함)
  async function createApprovalRequest(requestData, files = []) {
    loading.value = true;
    error.value = null;
    try {
      // FormData로 변환하여 파일과 함께 전송
      const formData = new FormData();
      
      // 기본 필드들 추가
      formData.append('title', requestData.title);
      formData.append('content', requestData.content);
      
      if (requestData.template_id) {
        formData.append('template_id', requestData.template_id);
      }
      if (requestData.form_data) {
        formData.append('form_data', JSON.stringify(requestData.form_data));
      }
      if (requestData.department_id) {
        formData.append('department_id', requestData.department_id);
      }
      if (requestData.approval_lines) {
        formData.append('approval_lines', JSON.stringify(requestData.approval_lines));
      }
      
      // 파일들 추가
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await authFetch(APPROVAL_API_URL, {
        method: 'POST',
        body: formData, // multipart/form-data로 전송
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

  // 다음 페이지 로드 함수들
  function loadNextPage() {
    if (currentPage.value < totalPage.value) {
      currentPage.value++;
      // 저장된 필터 파라미터 사용
      fetchMyApprovalRequests(lastMyApprovalParams.value, false);
    }
  }

  function loadNextPendingPage() {
    if (pendingCurrentPage.value < pendingTotalPage.value) {
      pendingCurrentPage.value++;
      // 저장된 필터 파라미터 사용
      fetchPendingApprovals(lastPendingParams.value, false);
    }
  }

  function loadNextCompletedPage() {
    if (completedCurrentPage.value < completedTotalPage.value) {
      completedCurrentPage.value++;
      // 저장된 필터 파라미터 사용
      fetchCompletedApprovals(lastCompletedParams.value, false);
    }
  }

  return {
    // 상태
    myApprovalRequests,
    pendingApprovals,
    completedApprovals,
    approvalDetail,
    approvalLines,
    approvalHistory,
    attachedFiles,
    loading,
    error,
    
    // 페이징 상태
    currentPage,
    totalPage,
    pendingCurrentPage,
    pendingTotalPage,
    completedCurrentPage,
    completedTotalPage,
    
    // 액션
    fetchMyApprovalRequests,
    fetchPendingApprovals,
    fetchCompletedApprovals,
    fetchApprovalDetail,
    fetchApprovalLines,
    createApprovalRequest,
    submitApproval,
    approveRequest,
    rejectRequest,
    recallRequest,
    setApprovalLines,
    clearState,
    loadNextPage,
    loadNextPendingPage,
    loadNextCompletedPage,
    
    // 계산된 속성
    canApprove,
    canRecall,
  };
});