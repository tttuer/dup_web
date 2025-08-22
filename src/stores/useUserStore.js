// src/stores/useUserStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authFetch } from '@/utils/authFetch';

const USER_API_URL = import.meta.env.VITE_USER_API_URL;


export const useUserStore = defineStore('user', () => {
  // 상태 관리
  const users = ref([]);
  const departments = ref([]);
  const approvers = ref([]);
  const currentUser = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // 현재 사용자 정보 조회
  // async function fetchCurrentUser() {
  //   loading.value = true;
  //   error.value = null;
  //   try {
  //     const response = await authFetch('/api/users/me');
  //     if (response.ok) {
  //       const data = await response.json();
  //       currentUser.value = data;
  //       return data;
  //     } else {
  //       throw new Error('사용자 정보 조회 실패');
  //     }
  //   } catch (err) {
  //     error.value = err.message;
  //     console.error('사용자 정보 조회 오류:', err);
  //     return null;
  //   } finally {
  //     loading.value = false;
  //   }
  // }

  // 결재자 목록 조회 (부서별)
  async function fetchApprovers(departmentId = null) {
    loading.value = true;
    error.value = null;
    try {
      const url = departmentId 
        ? `/api/users/approvers?department_id=${departmentId}`
        : '/api/users/approvers';
      
      const response = await authFetch(url);
      if (response.ok) {
        const data = await response.json();
        approvers.value = data;
        return data;
      } else {
        throw new Error('결재자 목록 조회 실패');
      }
    } catch (err) {
      error.value = err.message;
      console.error('결재자 목록 조회 오류:', err);
      return [];
    } finally {
      loading.value = false;
    }
  }

  // 사용자 검색
  async function searchUsers(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      const response = await authFetch(`${USER_API_URL}/search?name=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('사용자 검색 실패');
      }
    } catch (err) {
      console.error('사용자 검색 오류:', err);
      return [];
    }
  }

  // 부서별 사용자 조회
  function getUsersByDepartment(departmentId) {
    return users.value.filter(user => user.department_id === departmentId);
  }

  // 권한별 사용자 조회
  function getUsersByRole(role) {
    return users.value.filter(user => user.roles && user.roles.includes(role));
  }

  // 사용자 표시명 포맷 (이름 + 부서/직책)
  const formatUserDisplay = computed(() => {
    return (user) => {
      if (!user) return '';
      let display = user.name || user.username;
      if (user.department) {
        display += ` (${user.department})`;
      }
      if (user.position) {
        display += ` ${user.position}`;
      }
      return display;
    };
  });

  // 관리자 권한 체크
  const isAdmin = computed(() => {
    return currentUser.value && 
           currentUser.value.roles && 
           currentUser.value.roles.includes('ADMIN');
  });

  // 결재자 권한 체크
  const isApprover = computed(() => {
    return currentUser.value && 
           currentUser.value.roles && 
           (currentUser.value.roles.includes('ADMIN') || 
            currentUser.value.roles.includes('APPROVER'));
  });

  // 상태 초기화
  function clearState() {
    users.value = [];
    departments.value = [];
    approvers.value = [];
    error.value = null;
  }

  return {
    // 상태
    users,
    departments,
    approvers,
    currentUser,
    loading,
    error,
    
    // 액션
    // fetchCurrentUser,
    fetchApprovers,
    searchUsers,
    getUsersByDepartment,
    getUsersByRole,
    clearState,
    
    // 계산된 속성
    formatUserDisplay,
    isAdmin,
    isApprover,
  };
});