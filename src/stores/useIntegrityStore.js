// src/stores/useIntegrityStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { integrityApi, legalArchiveApi } from '@/utils/approvalApi';

export const useIntegrityStore = defineStore('integrity', () => {
  // 상태 관리
  const integrityResults = ref(new Map()); // requestId -> 무결성 검증 결과
  const integrityChains = ref(new Map()); // requestId -> 무결성 체인
  const legalDocumentExists = ref(new Map()); // requestId -> 법적 문서 존재 여부
  const tamperedDocuments = ref([]); // 위변조된 문서 목록
  const loading = ref(false);
  const error = ref(null);

  // 페이징 상태 (위변조 문서 목록용)
  const tamperedCurrentPage = ref(1);
  const tamperedTotalPage = ref(0);

  // 무결성 검증
  async function verifyIntegrity(requestId) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await integrityApi.verifyIntegrity(requestId);
      integrityResults.value.set(requestId, result);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('무결성 검증 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 무결성 체인 조회
  async function fetchIntegrityChain(requestId) {
    loading.value = true;
    error.value = null;
    
    try {
      const chain = await integrityApi.getIntegrityChain(requestId);
      integrityChains.value.set(requestId, chain);
      return chain;
    } catch (err) {
      error.value = err.message;
      console.error('무결성 체인 조회 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 법적 문서 존재 확인
  async function checkLegalDocumentExists(requestId) {
    try {
      const result = await legalArchiveApi.checkLegalDocumentExists(requestId);
      legalDocumentExists.value.set(requestId, result.exists);
      return result.exists;
    } catch (err) {
      console.error('법적 문서 존재 확인 오류:', err);
      legalDocumentExists.value.set(requestId, false);
      return false;
    }
  }

  // 법적 문서 다운로드
  async function downloadLegalDocument(requestId, fileName = null) {
    loading.value = true;
    error.value = null;
    
    try {
      await legalArchiveApi.downloadLegalDocument(requestId, fileName);
    } catch (err) {
      error.value = err.message;
      console.error('법적 문서 다운로드 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 위변조된 문서 목록 조회
  async function fetchTamperedDocuments(isReset = false) {
    loading.value = true;
    error.value = null;
    
    try {
      if (isReset) {
        tamperedDocuments.value = [];
        tamperedCurrentPage.value = 1;
      }

      const data = await integrityApi.getTamperedDocuments(
        tamperedCurrentPage.value,
        20
      );

      if (Array.isArray(data)) {
        if (isReset) {
          tamperedDocuments.value = data;
        } else {
          tamperedDocuments.value = [...tamperedDocuments.value, ...data];
        }
        // 마지막 페이지 여부 판단
        if (data.length < 20) {
          tamperedTotalPage.value = tamperedCurrentPage.value;
        } else {
          tamperedTotalPage.value = tamperedCurrentPage.value + 1;
        }
      } else if (data.items) {
        if (isReset) {
          tamperedDocuments.value = data.items;
        } else {
          tamperedDocuments.value = [...tamperedDocuments.value, ...data.items];
        }
        tamperedTotalPage.value = data.total_pages;
      }
    } catch (err) {
      error.value = err.message;
      console.error('위변조 문서 목록 조회 오류:', err);
    } finally {
      loading.value = false;
    }
  }

  // 무결성 기록 수동 생성
  async function createIntegrityRecord(requestId) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await integrityApi.createIntegrityRecord(requestId);
      // 생성 후 무결성 검증 결과 업데이트
      await verifyIntegrity(requestId);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('무결성 기록 생성 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 법적 문서 수동 생성
  async function createLegalDocument(requestId) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await legalArchiveApi.createLegalDocument(requestId);
      // 생성 후 존재 여부 업데이트
      await checkLegalDocumentExists(requestId);
      return result;
    } catch (err) {
      error.value = err.message;
      console.error('법적 문서 생성 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 위변조 문서 다음 페이지 로드
  function loadNextTamperedPage() {
    if (tamperedCurrentPage.value < tamperedTotalPage.value) {
      tamperedCurrentPage.value++;
      fetchTamperedDocuments(false);
    }
  }

  // 계산된 속성들
  const getIntegrityStatus = computed(() => {
    return (requestId) => {
      const result = integrityResults.value.get(requestId);
      if (!result) return null;
      
      return {
        isValid: result.is_valid,
        message: result.message,
        lastChecked: result.checked_at,
        hashValue: result.current_hash,
        chainValid: result.chain_valid
      };
    };
  });

  const getIntegrityChain = computed(() => {
    return (requestId) => {
      return integrityChains.value.get(requestId) || [];
    };
  });

  const isLegalDocumentAvailable = computed(() => {
    return (requestId) => {
      return legalDocumentExists.value.get(requestId) || false;
    };
  });

  const tamperedDocumentsCount = computed(() => {
    return tamperedDocuments.value.length;
  });

  // 상태 초기화
  function clearIntegrityData(requestId) {
    if (requestId) {
      integrityResults.value.delete(requestId);
      integrityChains.value.delete(requestId);
      legalDocumentExists.value.delete(requestId);
    } else {
      integrityResults.value.clear();
      integrityChains.value.clear();
      legalDocumentExists.value.clear();
      tamperedDocuments.value = [];
    }
    error.value = null;
  }

  return {
    // 상태
    integrityResults,
    integrityChains,
    legalDocumentExists,
    tamperedDocuments,
    loading,
    error,
    tamperedCurrentPage,
    tamperedTotalPage,

    // 액션
    verifyIntegrity,
    fetchIntegrityChain,
    checkLegalDocumentExists,
    downloadLegalDocument,
    fetchTamperedDocuments,
    createIntegrityRecord,
    createLegalDocument,
    loadNextTamperedPage,
    clearIntegrityData,

    // 계산된 속성
    getIntegrityStatus,
    getIntegrityChain,
    isLegalDocumentAvailable,
    tamperedDocumentsCount,
  };
});