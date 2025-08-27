<template>
  <div 
    v-if="isVisible" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleBackdropClick"
  >
    <div 
      class="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      @mousedown="dragProtection.handleMouseDown"
      @mouseup="dragProtection.handleMouseUp"
    >
      <!-- 헤더 -->
      <div class="flex justify-between items-center p-6 border-b">
        <h3 class="text-xl font-semibold">
          {{ editGroup ? '결재선 그룹 편집' : '새 결재선 그룹' }}
        </h3>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- 폼 내용 -->
      <div class="p-6 space-y-6">
        <!-- 그룹명 입력 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            그룹명 <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="예: 구매팀 결재선"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            :class="{ 'border-red-300': errors.name }"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
        </div>

        <!-- 결재자 선택 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            결재자 <span class="text-red-500">*</span>
          </label>
          
          <!-- 결재자 검색 -->
          <div class="relative mb-3">
            <input
              v-model="searchTerm"
              type="text"
              placeholder="결재자를 검색하세요..."
              class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <!-- 선택된 결재자 목록 (카드형 UI) -->
          <div v-if="formData.approverIds.length > 0" class="mb-4">
            <h4 class="text-sm font-medium text-gray-700 mb-2">선택된 결재자 ({{ formData.approverIds.length }}명)</h4>
            <div class="flex items-center space-x-3 overflow-x-auto pb-2 pt-3 px-3 bg-gray-50 rounded-md min-h-[100px]">
              <div
                v-for="(approverName, index) in formData.approverNames"
                :key="`${formData.approverIds[index]}-${index}`"
                class="flex items-center space-x-3 flex-shrink-0"
              >
                <!-- 결재자 카드 -->
                <div class="relative group bg-white border-2 border-blue-200 rounded-lg p-3 min-w-[140px]">
                  <!-- 순서 배지 -->
                  <div class="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {{ index + 1 }}
                  </div>
                  
                  <!-- 삭제 버튼 -->
                  <button
                    @click="removeApprover(formData.approverIds[index])"
                    class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X class="w-3 h-3 mx-auto" />
                  </button>
                  
                  <!-- 결재자 정보 -->
                  <div class="text-center">
                    <div class="font-medium text-gray-900 text-sm">{{ approverName }}</div>
                  </div>
                  
                  <!-- 순서 변경 버튼 -->
                  <div class="mt-2 flex justify-center space-x-1">
                    <button
                      v-if="index > 0"
                      @click="moveApprover(index, index - 1)"
                      class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="왼쪽으로 이동"
                    >
                      <ChevronLeft class="w-3 h-3" />
                    </button>
                    <button
                      v-if="index < formData.approverIds.length - 1"
                      @click="moveApprover(index, index + 1)"
                      class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="오른쪽으로 이동"
                    >
                      <ChevronRight class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <!-- 화살표 (마지막이 아닌 경우) -->
                <ArrowRight v-if="index < formData.approverNames.length - 1" class="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </div>

          <!-- 사용자 목록 -->
          <div class="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              @click="addApprover(user)"
              class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
            >
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User class="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div class="font-medium text-gray-900">{{ user.name }}</div>
                  <div class="text-sm text-gray-500">{{ user.department }}</div>
                </div>
              </div>
            </div>
            <div v-if="filteredUsers.length === 0" class="p-4 text-center text-gray-500">
              검색 결과가 없습니다.
            </div>
          </div>
          <p v-if="errors.approvers" class="mt-1 text-sm text-red-600">{{ errors.approvers }}</p>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="favoriteStore.error" class="bg-red-50 border border-red-200 rounded-md p-4">
          <div class="flex">
            <AlertCircle class="w-5 h-5 text-red-400" />
            <div class="ml-3">
              <p class="text-sm text-red-700">{{ favoriteStore.error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 푸터 -->
      <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
        <button
          @click="closeModal"
          class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
        >
          취소
        </button>
        <button
          @click="handleSave"
          :disabled="!canSave || favoriteStore.loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader v-if="favoriteStore.loading" class="w-4 h-4 animate-spin mr-2" />
          {{ editGroup ? '수정' : '생성' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X, Search, User, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, Loader, AlertCircle } from 'lucide-vue-next';
import { useFavoriteApprovalStore } from '@/stores/useFavoriteApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import { useModalDragProtection } from '@/composables/useModalDragProtection';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  editGroup: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'save']);

const favoriteStore = useFavoriteApprovalStore();
const userStore = useUserStore();

// 모달 드래그 보호 기능
const dragProtection = useModalDragProtection();

// 상태 관리
const searchTerm = ref('');
const formData = ref({
  name: '',
  approverIds: [],
  approverNames: [],
});
const errors = ref({});

// 검색 결과 상태
const searchResults = ref([]);

// 사용자 검색 함수 (ApprovalLineModal과 동일)
const searchUsers = async () => {
  if (!searchTerm.value || searchTerm.value.length < 2) {
    searchResults.value = [];
    return;
  }

  try {
    const results = await userStore.searchUsers(searchTerm.value);
    
    // ApprovalLineModal과 동일한 방식으로 현재 사용자 정보 추출
    const getCurrentUserFromToken = () => {
      if (typeof window === 'undefined') return null;
      
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch (error) {
        console.error('토큰 파싱 오류:', error);
        return null;
      }
    };
    
    const currentUser = getCurrentUserFromToken();
    const existingIds = new Set(formData.value.approverIds);
    
    searchResults.value = results.filter(user => {
      // 본인 제외 (ApprovalLineModal과 동일한 방식)
      const isCurrentUser = currentUser && user.user_id === currentUser.user_id;
      
      // 이미 추가된 결재자 제외
      const isAlreadyAdded = existingIds.has(user.user_id);
      
      return !isCurrentUser && !isAlreadyAdded;
    });
  } catch (error) {
    console.error('사용자 검색 오류:', error);
    searchResults.value = [];
  }
};

// 결재자 추가
const addApprover = (user) => {
  // 중복 체크
  if (formData.value.approverIds.includes(user.user_id)) {
    return;
  }

  // 사용자 ID와 이름 함께 저장
  formData.value.approverIds.push(user.user_id);
  formData.value.approverNames.push(user.name);
  
  // 검색 결과에서 해당 사용자 제거
  searchResults.value = searchResults.value.filter(u => u.user_id !== user.user_id);
  
  // 검색어 초기화
  if (searchResults.value.length === 0) {
    searchTerm.value = '';
  }
  
  validateForm();
};

// 표시할 사용자 목록
const filteredUsers = computed(() => {
  return searchResults.value;
});


const canSave = computed(() => {
  return formData.value.name.trim() && 
         formData.value.approverIds.length > 0 && 
         !Object.keys(errors.value).length;
});

// 결재자 제거
const removeApprover = (userId) => {
  const index = formData.value.approverIds.indexOf(userId);
  if (index > -1) {
    formData.value.approverIds.splice(index, 1);
    formData.value.approverNames.splice(index, 1);
    
    // 현재 검색어가 있다면 다시 검색해서 제거된 사용자가 나타날 수 있도록
    if (searchTerm.value && searchTerm.value.length >= 2) {
      searchUsers();
    }
  }
  validateForm();
};

// 결재자 순서 이동
const moveApprover = (fromIndex, toIndex) => {
  // ID 배열 순서 변경
  const approverIds = [...formData.value.approverIds];
  const [movedId] = approverIds.splice(fromIndex, 1);
  approverIds.splice(toIndex, 0, movedId);
  formData.value.approverIds = approverIds;
  
  // 이름 배열 순서 변경
  const approverNames = [...formData.value.approverNames];
  const [movedName] = approverNames.splice(fromIndex, 1);
  approverNames.splice(toIndex, 0, movedName);
  formData.value.approverNames = approverNames;
};

// 폼 유효성 검사
const validateForm = () => {
  errors.value = {};
  
  // 그룹명 검증
  if (!formData.value.name.trim()) {
    errors.value.name = '그룹명을 입력해주세요.';
  } else if (favoriteStore.isNameExists(formData.value.name.trim(), props.editGroup?.id)) {
    errors.value.name = '이미 존재하는 그룹명입니다.';
  }
  
  // 결재자 검증
  if (formData.value.approverIds.length === 0) {
    errors.value.approvers = '최소 1명의 결재자를 선택해주세요.';
  }
};

// 저장 처리
const handleSave = () => {
  validateForm();
  if (canSave.value) {
    emit('save', {
      name: formData.value.name.trim(),
      approverIds: formData.value.approverIds,
      approverNames: formData.value.approverNames,
    });
  }
};

// 배경 클릭 핸들러
const handleBackdropClick = (event) => {
  dragProtection.handleBackdropClick(event, closeModal);
};

// 모달 닫기
const closeModal = () => {
  dragProtection.removeGlobalDragListeners();
  emit('close');
};

// 폼 초기화
const resetForm = () => {
  formData.value = {
    name: '',
    approverIds: [],
    approverNames: [],
  };
  searchResults.value = [];
  errors.value = {};
  searchTerm.value = '';
};

// 편집 그룹 설정
const setEditGroup = async (group) => {
  if (group) {
    formData.value = {
      name: group.name,
      approverIds: [...group.approver_ids],
      approverNames: [...(group.approver_names || [])],
    };
  } else {
    resetForm();
  }
  errors.value = {};
};

// 모달 표시/숨김 감시
watch(() => props.isVisible, (visible) => {
  if (visible) {
    setEditGroup(props.editGroup);
    favoriteStore.clearError();
    dragProtection.addGlobalDragListeners(); // 전역 드래그 리스너 추가
  } else {
    dragProtection.removeGlobalDragListeners(); // 전역 드래그 리스너 제거
  }
});

// 편집 그룹 변경 감시
watch(() => props.editGroup, (group) => {
  if (props.isVisible) {
    setEditGroup(group);
  }
});

// 폼 데이터 변경 감시
watch(formData, validateForm, { deep: true });

// 검색어 변경 시 자동 검색 (ApprovalLineModal과 동일한 방식)
let searchTimeout = null;
watch(searchTerm, (newQuery) => {
  // 기존 타이머 취소
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // 검색어가 비어있으면 즉시 결과 초기화
  if (!newQuery || newQuery.length < 2) {
    searchResults.value = [];
    return;
  }
  
  // 300ms 후에 검색 실행
  searchTimeout = setTimeout(() => {
    searchUsers();
  }, 300);
});
</script>