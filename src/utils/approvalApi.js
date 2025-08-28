// src/utils/approvalApi.js
import { authFetch } from '@/utils/authFetch';

const FILE_API_URL = import.meta.env.VITE_FILE_API_URL;
const API_URL = import.meta.env.VITE_API_URL;

// API 에러 처리 래퍼
const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: '알 수 없는 오류가 발생했습니다.' }));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response;
};

// 파일 업로드 관련 API
export const fileApi = {
  // 첨부파일 업로드
  async uploadFile(requestId, file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await authFetch(`${FILE_API_URL}/approvals/${requestId}`, {
      method: 'POST',
      body: formData,
    });
    
    await handleApiError(response);
    return await response.json();
  },

  // 첨부파일 목록 조회
  async getFiles(requestId) {
    const response = await authFetch(`${FILE_API_URL}/approvals/${requestId}`);
    
    if (!response.ok) {
      throw new Error('파일 목록 조회 실패');
    }
    
    return await response.json();
  },

  // 파일 다운로드
  async downloadFile(fileId, fileName) {
    const response = await authFetch(`${FILE_API_URL}/approvals/${fileId}/download`);
    
    if (!response.ok) {
      throw new Error('파일 다운로드 실패');
    }
    
    const blob = await response.blob();
    
    // 파일 다운로드 처리
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // 첨부파일 삭제
  async deleteFile(fileId) {
    const response = await authFetch(`${FILE_API_URL}/approvals/${fileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '파일 삭제 실패');
    }
    
    return true;
  },

  // 전체 파일 ZIP 다운로드
  async downloadAllFiles(requestId, zipFileName = 'approval_files') {
    const response = await authFetch(`${FILE_API_URL}/approvals/${requestId}/download-all`);
    
    if (!response.ok) {
      throw new Error('파일 일괄 다운로드 실패');
    }
    
    const blob = await response.blob();
    
    // ZIP 파일 다운로드 처리
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${zipFileName}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// 문서번호 관련 API
export const documentNumberApi = {
  // 다음 문서번호 조회
  async getNextDocumentNumber(templateId = null) {
    const url = templateId 
      ? `/api/document-numbers/next?template_id=${templateId}`
      : '/api/document-numbers/next';
    
    const response = await authFetch(url);
    
    if (!response.ok) {
      throw new Error('문서번호 조회 실패');
    }
    
    return await response.json();
  },
};

// 결재 이력 관련 API (상세조회에서 histories로 반환되므로 별도 API 불필요)
export const historyApi = {
  // 결재 이력은 상세조회에서 histories 필드로 제공됨
  // 별도 API 호출하지 않음
};

// 결재선 관련 API
export const approvalLineApi = {
  // 내 결재 대기 목록
  async getMyPendingApprovals() {
    const response = await authFetch('/api/approval-lines/my-pending');
    
    if (!response.ok) {
      throw new Error('결재 대기 목록 조회 실패');
    }
    
    return await response.json();
  },

  // 내 결재 이력
  async getMyApprovalHistory() {
    const response = await authFetch('/api/approval-lines/my-history');
    
    if (!response.ok) {
      throw new Error('결재 이력 조회 실패');
    }
    
    return await response.json();
  },
};

// 유틸리티 함수들
export const approvalUtils = {
  // 파일 크기 포맷팅
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 파일 타입 아이콘 반환
  getFileTypeIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'file-text';
      case 'doc':
      case 'docx':
        return 'file-text';
      case 'xls':
      case 'xlsx':
        return 'file-spreadsheet';
      case 'ppt':
      case 'pptx':
        return 'presentation';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      default:
        return 'file';
    }
  },

  // 결재 상태별 컬러 반환
  getStatusColor(status) {
    switch (status) {
      case 'DRAFT':
        return 'gray';
      case 'SUBMITTED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'yellow';
      case 'APPROVED':
        return 'green';
      case 'REJECTED':
        return 'red';
      case 'CANCELLED':
        return 'gray';
      default:
        return 'gray';
    }
  },

  // 결재선 순서 검증
  validateApprovalLine(lines) {
    if (!lines || lines.length === 0) {
      return { valid: false, message: '결재선이 비어있습니다.' };
    }

    // 순서 중복 체크
    const orders = lines.map(line => line.step_order);
    const uniqueOrders = [...new Set(orders)];
    
    if (orders.length !== uniqueOrders.length) {
      return { valid: false, message: '결재 순서가 중복되었습니다.' };
    }

    // 순서 연속성 체크
    const sortedOrders = uniqueOrders.sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        return { valid: false, message: '결재 순서가 연속되지 않습니다.' };
      }
    }

    return { valid: true, message: '유효한 결재선입니다.' };
  },
};

// 즐겨찾기 그룹 관련 API
export const favoriteApi = {
  // 즐겨찾기 그룹 생성
  async createFavoriteGroup(name, approverIds) {
    const response = await authFetch(`${API_URL}/approval-lines/favorite-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        approver_ids: approverIds,
      }),
    });
    return response.json();
  },

  // 내 즐겨찾기 그룹 목록 조회
  async getMyFavoriteGroups() {
    const response = await authFetch(`${API_URL}/approval-lines/favorite-groups`);
    return response.json();
  },

  // 즐겨찾기 그룹 상세 조회
  async getFavoriteGroup(groupId) {
    const response = await authFetch(`${API_URL}/approval-lines/favorite-groups/${groupId}`);
    return response.json();
  },

  // 즐겨찾기 그룹 수정
  async updateFavoriteGroup(groupId, updates) {
    const response = await authFetch(`${API_URL}/approval-lines/favorite-groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updates.name,
        approver_ids: updates.approverIds,
      }),
    });
    return response.json();
  },

  // 즐겨찾기 그룹 삭제
  async deleteFavoriteGroup(groupId) {
    const response = await authFetch(`${API_URL}/approval-lines/favorite-groups/${groupId}`, {
      method: 'DELETE',
    });
    return response.ok;
  },

  // 즐겨찾기 그룹을 결재선에 적용
  async applyFavoriteGroupToRequest(groupId, requestId) {
    const response = await authFetch(`${API_URL}/approval-lines/favorite-groups/${groupId}/apply-to-request?request_id=${requestId}`, {
      method: 'POST',
    });
    return response.json();
  },
};