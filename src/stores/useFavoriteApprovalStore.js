// src/stores/useFavoriteApprovalStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { favoriteApi } from '@/utils/approvalApi';

export const useFavoriteApprovalStore = defineStore('favoriteApproval', () => {
  // 상태 관리
  const favoriteGroups = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 계산된 속성
  const hasFavoriteGroups = computed(() => favoriteGroups.value.length > 0);

  // 즐겨찾기 그룹 목록 조회
  const fetchFavoriteGroups = async () => {
    loading.value = true;
    error.value = null;
    try {
      const groups = await favoriteApi.getMyFavoriteGroups();
      favoriteGroups.value = groups;
    } catch (err) {
      error.value = err.message;
      console.error('즐겨찾기 그룹 조회 실패:', err);
    } finally {
      loading.value = false;
    }
  };

  // 즐겨찾기 그룹 생성
  const createFavoriteGroup = async (name, approverIds) => {
    loading.value = true;
    error.value = null;
    try {
      const newGroup = await favoriteApi.createFavoriteGroup(name, approverIds);
      favoriteGroups.value.unshift(newGroup);
      return newGroup;
    } catch (err) {
      error.value = err.message;
      console.error('즐겨찾기 그룹 생성 실패:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 즐겨찾기 그룹 수정
  const updateFavoriteGroup = async (groupId, updates) => {
    loading.value = true;
    error.value = null;
    try {
      const updatedGroup = await favoriteApi.updateFavoriteGroup(groupId, updates);
      const index = favoriteGroups.value.findIndex(g => g.id === groupId);
      if (index > -1) {
        favoriteGroups.value[index] = updatedGroup;
      }
      return updatedGroup;
    } catch (err) {
      error.value = err.message;
      console.error('즐겨찾기 그룹 수정 실패:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 즐겨찾기 그룹 삭제
  const deleteFavoriteGroup = async (groupId) => {
    loading.value = true;
    error.value = null;
    try {
      const success = await favoriteApi.deleteFavoriteGroup(groupId);
      if (success) {
        favoriteGroups.value = favoriteGroups.value.filter(g => g.id !== groupId);
      }
      return success;
    } catch (err) {
      error.value = err.message;
      console.error('즐겨찾기 그룹 삭제 실패:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 즐겨찾기 그룹을 결재선에 적용
  const applyFavoriteGroup = async (groupId, requestId) => {
    loading.value = true;
    error.value = null;
    try {
      const addedLines = await favoriteApi.applyFavoriteGroupToRequest(groupId, requestId);
      return addedLines;
    } catch (err) {
      error.value = err.message;
      console.error('즐겨찾기 그룹 적용 실패:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 특정 결재자들로 즐겨찾기 그룹 검색
  const findGroupByApprovers = (approverIds) => {
    return favoriteGroups.value.find(group => {
      if (group.approver_ids.length !== approverIds.length) return false;
      return group.approver_ids.every(id => approverIds.includes(id));
    });
  };

  // 즐겨찾기 그룹명 중복 체크
  const isNameExists = (name, excludeId = null) => {
    return favoriteGroups.value.some(group => 
      group.name === name && group.id !== excludeId
    );
  };

  // 상태 초기화
  const clearError = () => {
    error.value = null;
  };

  const resetState = () => {
    favoriteGroups.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    // 상태
    favoriteGroups,
    loading,
    error,

    // 계산된 속성
    hasFavoriteGroups,

    // 액션
    fetchFavoriteGroups,
    createFavoriteGroup,
    updateFavoriteGroup,
    deleteFavoriteGroup,
    applyFavoriteGroup,
    findGroupByApprovers,
    isNameExists,
    clearError,
    resetState,
  };
});