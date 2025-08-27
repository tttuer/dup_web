<template>
  <div 
    v-if="isVisible" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto">
      <!-- 헤더 -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">결재선 설정</h3>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 탭 메뉴 -->
      <div class="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          @click="activeTab = 'setup'"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'setup' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          결재선 설정
        </button>
        <button
          @click="activeTab = 'manage'"
          :class="[
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'manage' 
              ? 'bg-white text-blue-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          ]"
        >
          그룹 관리
        </button>
      </div>

      <!-- 결재선 설정 탭 -->
      <div v-if="activeTab === 'setup'">
        <!-- 결재선 그룹 -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <label class="block text-sm font-medium text-gray-700">
              결재선 그룹
            </label>
          </div>
          
          <div v-if="favoriteStore.hasFavoriteGroups" class="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <button
              v-for="group in favoriteStore.favoriteGroups"
              :key="group.id"
              @click="applyFavoriteGroup(group)"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 text-left"
            >
              <div>
                <div class="font-medium text-gray-900">{{ group.name }}</div>
                <div class="text-xs text-gray-500">{{ (group.approver_names || []).length }}명</div>
              </div>
            </button>
          </div>
          
          <div v-else class="text-center py-4 text-gray-500 text-sm">
            저장된 결재선 그룹이 없습니다.
          </div>
        </div>

        <!-- 결재자 검색 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            결재자 검색
          </label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="이름이나 부서명으로 검색..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search class="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          
          <!-- 검색 결과 -->
          <div 
            v-if="searchResults.length > 0" 
            class="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto"
          >
            <div
              v-for="user in searchResults"
              :key="user.id"
              @click="addApprover(user)"
              class="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div class="font-medium">{{ user.name }}</div>
              <div class="text-sm text-gray-500">{{ user.department }} {{ user.position }}</div>
            </div>
          </div>
        </div>

        <!-- 현재 결재선 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            결재선 ({{ approvalLines.length }}명)
          </label>
          
          <div v-if="approvalLines.length === 0" class="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            결재자를 검색해서 추가해주세요.
          </div>
          
          <div v-else class="flex items-center space-x-3 overflow-x-auto pb-2 pt-3 px-3">
            <div
              v-for="(line, index) in approvalLines"
              :key="`${line.approver_id}-${index}`"
              class="flex items-center space-x-3 flex-shrink-0"
            >
              <!-- 결재자 카드 -->
              <div class="relative group bg-white border-2 border-blue-200 rounded-lg p-3 min-w-[160px]">
                <!-- 순서 배지 -->
                <div class="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {{ index + 1 }}
                </div>
                
                <!-- 삭제 버튼 -->
                <button
                  @click="removeApprover(index)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X class="w-3 h-3 mx-auto" />
                </button>
                
                <!-- 결재자 정보 -->
                <div class="text-center">
                  <div class="font-medium text-gray-900">{{ line.approver_name }}</div>
                  <div class="font-normal text-xs text-gray-900">({{ line.approver_user_id }})</div>
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
                    v-if="index < approvalLines.length - 1"
                    @click="moveApprover(index, index + 1)"
                    class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="오른쪽으로 이동"
                  >
                    <ChevronRight class="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <!-- 화살표 (마지막이 아닌 경우) -->
              <ArrowRight v-if="index < approvalLines.length - 1" class="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>

        <!-- 검증 메시지 -->
        <div v-if="validationMessage" class="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {{ validationMessage }}
        </div>

        <!-- 버튼 -->
        <div class="flex justify-between items-center">
          <!-- 결재선 그룹 저장 버튼 -->
          <button
            v-if="approvalLines.length > 0"
            @click="showSaveFavoriteModal = true"
            class="inline-flex items-center px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
          >
            <Star class="w-4 h-4 mr-1" />
            그룹으로 저장
          </button>
          <div v-else></div>

          <div class="flex space-x-3">
            <button
              @click="closeModal"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              취소
            </button>
            <button
              @click="saveApprovalLines"
              :disabled="!isValid || loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
              저장
            </button>
          </div>
        </div>
      </div>

      <!-- 그룹 관리 탭 -->
      <div v-else-if="activeTab === 'manage'">
        <FavoriteGroupManagement @group-updated="handleGroupUpdated" />
      </div>
    </div>
  </div>

  <!-- 결재선 그룹 저장 모달 -->
  <div
    v-if="showSaveFavoriteModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60"
    @click.self="showSaveFavoriteModal = false"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">결재선 그룹으로 저장</h3>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">그룹명</label>
        <input
          v-model="favoriteGroupName"
          type="text"
          placeholder="예: 구매팀 승인선"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div class="flex justify-end space-x-3">
        <button
          @click="showSaveFavoriteModal = false"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
        >
          취소
        </button>
        <button
          @click="saveFavoriteGroup"
          :disabled="!favoriteGroupName.trim() || favoriteStore.loading"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <Loader v-if="favoriteStore.loading" class="w-4 h-4 animate-spin mr-2" />
          저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { X, Search, Loader, ArrowRight, Star, Plus, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/stores/useUserStore';
import { useFavoriteApprovalStore } from '@/stores/useFavoriteApprovalStore';
import { approvalUtils } from '@/utils/approvalApi';
import FavoriteGroupManagement from './FavoriteGroupManagement.vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  requestId: {
    type: String,
    default: '',
  },
  initialLines: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'save']);

const userStore = useUserStore();
const favoriteStore = useFavoriteApprovalStore();
const toast = useToast();

// 상태 관리
const searchQuery = ref('');
const searchResults = ref([]);
const approvalLines = ref([]);
const loading = ref(false);
const validationMessage = ref('');
const showSaveFavoriteModal = ref(false);
const favoriteGroupName = ref('');
const activeTab = ref('setup'); // 탭 상태 추가

// 초기화
watch(() => props.isVisible, async (newValue) => {
  if (newValue) {
    
    // 초기 결재선을 복사하고 사용자 정보를 조회
    const initialLines = [...props.initialLines];
    
    // 각 결재선의 사용자 정보를 조회하여 이름 등을 업데이트
    for (const line of initialLines) {
      if ((line.approver_id || line.approver_user_id) && !line.approver_name) {
        try {
          // 사용자 정보 조회 (ID로 검색)
          const searchId = line.approver_user_id || line.approver_id;
          const userData = await userStore.searchUsers(searchId);
          if (userData && userData.length > 0) {
            const user = userData[0];
            line.approver_name = user.name;
            line.approver_department = user.department || '';
            line.approver_position = user.position || '';
            // ID 정보 보완
            if (!line.approver_id) line.approver_id = user.id;
            if (!line.approver_user_id) line.approver_user_id = user.user_id;
          }
        } catch (error) {
          console.warn('사용자 정보 조회 실패:', error);
          // 실패 시 ID를 이름으로 사용
          line.approver_name = line.approver_name || line.approver_user_id || line.approver_id;
        }
      }
    }
    
    approvalLines.value = initialLines;
    searchQuery.value = '';
    searchResults.value = [];
    validationMessage.value = '';
  }
});

// 사용자 검색
const searchUsers = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  
  try {
    const results = await userStore.searchUsers(searchQuery.value);
    
    // JWT 토큰에서 현재 사용자 정보 추출
    const getCurrentUserFromToken = () => {
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
    
    
    const existingIds = new Set(approvalLines.value.map(line => line.approver_id));
    const existingUserIds = new Set(approvalLines.value.map(line => line.approver_user_id));
    
    searchResults.value = results.filter(user => {
      // 본인 제외 (user_id로만 비교)
      const isCurrentUser = currentUser && user.user_id === currentUser.user_id;
      
      // 이미 추가된 결재자 제외
      const isAlreadyAdded = existingIds.has(user.id) || existingUserIds.has(user.user_id);
      
      
      return !isCurrentUser && !isAlreadyAdded;
    });
  } catch (error) {
    console.error('사용자 검색 오류:', error);
  }
};

// 결재자 추가
const addApprover = (user) => {
  const newLine = {
    approver_id: user.id,
    approver_user_id: user.user_id,
    approver_name: user.name,
    approver_department: user.department || '',
    approver_position: user.position || '',
    step_order: approvalLines.value.length + 1,
    is_required: true,
    is_parallel: false,
  };
  
  approvalLines.value.push(newLine);
  searchQuery.value = '';
  searchResults.value = [];
  validateLines();
};

// 결재자 제거
const removeApprover = (index) => {
  approvalLines.value.splice(index, 1);
  // 순서 재정렬
  approvalLines.value.forEach((line, idx) => {
    line.step_order = idx + 1;
  });
  validateLines();
};

// 결재자 순서 이동
const moveApprover = (fromIndex, toIndex) => {
  const lines = [...approvalLines.value];
  const [movedLine] = lines.splice(fromIndex, 1);
  lines.splice(toIndex, 0, movedLine);
  
  // 순서 재정렬
  lines.forEach((line, idx) => {
    line.step_order = idx + 1;
  });
  
  approvalLines.value = lines;
  validateLines();
};


// 결재선 검증
const validateLines = () => {
  const validation = approvalUtils.validateApprovalLine(approvalLines.value);
  validationMessage.value = validation.valid ? '' : validation.message;
};

// 유효성 검사
const isValid = computed(() => {
  return approvalLines.value.length > 0 && !validationMessage.value;
});

// 저장
const saveApprovalLines = async () => {
  if (!isValid.value) return;
  
  loading.value = true;
  try {
    const linesToSave = approvalLines.value.map(line => ({
      approver_id: line.approver_id,
      approver_user_id: line.approver_user_id,
      approver_name: line.approver_name,
      approver_department: line.approver_department,
      approver_position: line.approver_position,
      step_order: line.step_order,
      is_required: line.is_required,
      is_parallel: line.is_parallel,
    }));
    
    emit('save', linesToSave);
  } catch (error) {
    console.error('결재선 저장 오류:', error);
  } finally {
    loading.value = false;
  }
};

// 검색어 변경 시 자동 검색 (debounce 적용)
let searchTimeout = null;
watch(searchQuery, (newQuery) => {
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

// 즐겨찾기 그룹 적용
const applyFavoriteGroup = (group) => {
  try {
    // 기존 결재선을 완전히 교체
    approvalLines.value = [];
    
    const approverIds = group.approver_ids || [];
    const approverNames = group.approver_names || [];
    
    for (let i = 0; i < approverIds.length; i++) {
      const newLine = {
        approver_id: null, // API에서 받을 때 설정
        approver_user_id: approverIds[i],
        approver_name: approverNames[i] || approverIds[i], // 이름이 없으면 ID 사용
        approver_department: '',
        approver_position: '',
        step_order: i + 1,
        is_required: true,
        is_parallel: false,
      };
      
      approvalLines.value.push(newLine);
    }
    
    validateLines();
  } catch (error) {
    console.error('즐겨찾기 그룹 적용 실패:', error);
  }
};

// 결재선 그룹 저장
const saveFavoriteGroup = async () => {
  try {
    const approverIds = approvalLines.value.map(line => line.approver_user_id);
    const approverNames = approvalLines.value.map(line => line.approver_name);
    
    const groupName = favoriteGroupName.value.trim();
    await favoriteStore.createFavoriteGroup(groupName, approverIds, approverNames);
    
    showSaveFavoriteModal.value = false;
    favoriteGroupName.value = '';
    
    toast.success(`"${groupName}" 그룹이 저장되었습니다.`);
  } catch (error) {
    console.error('결재선 그룹 저장 실패:', error);
    toast.error('결재선 그룹 저장에 실패했습니다.');
  }
};

// 그룹 업데이트 핸들러
const handleGroupUpdated = () => {
  // 그룹 목록 새로고침
  favoriteStore.fetchFavoriteGroups();
  // 결재선 설정 탭으로 돌아가기
  activeTab.value = 'setup';
};

// 모달 닫기
const closeModal = () => {
  searchQuery.value = '';
  searchResults.value = [];
  approvalLines.value = [];
  validationMessage.value = '';
  showSaveFavoriteModal.value = false;
  favoriteGroupName.value = '';
  activeTab.value = 'setup'; // 탭 초기화
  emit('close');
};

// 컴포넌트 마운트 시 즐겨찾기 데이터 로드
onMounted(async () => {
  try {
    await favoriteStore.fetchFavoriteGroups();
  } catch (error) {
    console.error('즐겨찾기 그룹 로드 실패:', error);
  }
});
</script>