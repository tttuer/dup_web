// src/stores/useTemplateStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authFetch } from '@/utils/authFetch';

const TEMPLATE_API_URL = import.meta.env.VITE_TEMPLATE_API_URL;

export const useTemplateStore = defineStore('template', () => {
  // 상태 관리
  const templates = ref([]);
  const templateDetail = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // 템플릿 목록 조회
  async function fetchTemplates() {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(TEMPLATE_API_URL);
      if (response.ok) {
        const data = await response.json();
        templates.value = data;
        return data;
      } else {
        throw new Error('템플릿 목록 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('템플릿 목록 조회 오류:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  // 템플릿 상세 조회
  async function fetchTemplateDetail(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${TEMPLATE_API_URL}/${id}`);
      if (response.ok) {
        const data = await response.json();
        templateDetail.value = data;
        return data;
      } else {
        throw new Error('템플릿 상세 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('템플릿 상세 조회 오류:', err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 템플릿 생성 (관리자 전용)
  async function createTemplate(templateData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(TEMPLATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchTemplates(); // 목록 새로고침
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '템플릿 생성 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('템플릿 생성 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 템플릿 수정 (관리자 전용)
  async function updateTemplate(id, templateData) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${TEMPLATE_API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchTemplates(); // 목록 새로고침
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '템플릿 수정 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('템플릿 수정 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 템플릿 삭제 (관리자 전용)
  async function deleteTemplate(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await authFetch(`${TEMPLATE_API_URL}/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchTemplates(); // 목록 새로고침
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '템플릿 삭제 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('템플릿 삭제 오류:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 카테고리별 템플릿 조회
  function getTemplatesByCategory(category) {
    return templates.value.filter(template => 
      template.category === category && template.is_active
    );
  }

  // 상태 초기화
  function clearState() {
    templateDetail.value = null;
    error.value = null;
  }

  return {
    // 상태
    templates,
    templateDetail,
    loading,
    error,
    
    // 액션
    fetchTemplates,
    fetchTemplateDetail,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    clearState,
  };
});