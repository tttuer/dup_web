<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">결재선 그룹 관리</h3>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        <Plus class="w-4 h-4 mr-2" />
        새 그룹
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="favoriteStore.loading" class="flex justify-center py-8">
      <Loader class="w-6 h-6 animate-spin text-blue-600" />
    </div>

    <!-- 결재선 그룹 목록 (카드 형식) -->
    <div v-else-if="favoriteStore.hasFavoriteGroups" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="group in favoriteStore.favoriteGroups"
        :key="group.id"
        class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
      >
        <!-- 카드 헤더 -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Star class="w-5 h-5 text-blue-600" />
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-gray-900 text-lg">{{ group.name }}</h4>
              <div class="flex items-center space-x-1 mt-1">
                <Users class="w-4 h-4 text-gray-400" />
                <span class="text-sm text-gray-500">{{ (group.approver_names || []).length }}명의 결재자</span>
              </div>
            </div>
          </div>
          
          <!-- 액션 버튼 -->
          <div class="flex items-center space-x-1">
            <button
              @click="handleEdit(group)"
              class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="편집"
            >
              <Edit class="w-4 h-4" />
            </button>
            <button
              @click="handleDelete(group)"
              class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="삭제"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <!-- 결재선 (결재선 설정과 동일한 UI) -->
        <div class="space-y-3">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">결재 순서</div>
          <div class="flex items-center space-x-3 overflow-x-auto pb-2 pt-3 px-3 min-h-[80px]">
            <div
              v-for="(approverName, index) in (group.approver_names || [])"
              :key="`${approverName}-${index}`"
              class="flex items-center space-x-3 flex-shrink-0"
            >
              <!-- 결재자 카드 -->
              <div class="relative bg-white border-2 border-blue-200 rounded-lg p-3 min-w-[140px]">
                <!-- 순서 배지 -->
                <div class="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {{ index + 1 }}
                </div>
                
                <!-- 결재자 정보 -->
                <div class="text-center">
                  <div class="font-medium text-gray-900 text-sm">{{ approverName }}</div>
                </div>
              </div>
              
              <!-- 화살표 (마지막이 아닌 경우) -->
              <ArrowRight v-if="index < (group.approver_names || []).length - 1" class="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        </div>
        
        <!-- 카드 푸터 -->
        <div class="mt-4 pt-4 border-t border-gray-100">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">
              {{ formatDate(group.created_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 비어있는 상태 -->
    <div v-else class="text-center py-12">
      <Star class="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">결재선 그룹이 없습니다</h3>
      <p class="text-gray-500 mb-4">자주 사용하는 결재선을 그룹으로 저장해보세요.</p>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        <Plus class="w-4 h-4 mr-2" />
        첫 번째 그룹 만들기
      </button>
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

  <!-- 생성/편집 모달 -->
  <FavoriteGroupFormModal
    :is-visible="showCreateModal"
    :edit-group="editingGroup"
    @close="handleCloseModal"
    @save="handleSaveGroup"
  />

  <!-- 삭제 확인 모달 -->
  <div 
    v-if="showDeleteModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <div class="flex items-center mb-4">
        <AlertCircle class="w-6 h-6 text-red-600 mr-3" />
        <h3 class="text-lg font-semibold">그룹 삭제</h3>
      </div>
      <p class="text-gray-600 mb-6">
        '<strong>{{ deletingGroup?.name }}</strong>' 그룹을 삭제하시겠습니까?<br>
        삭제된 그룹은 복구할 수 없습니다.
      </p>
      <div class="flex justify-end space-x-3">
        <button
          @click="showDeleteModal = false"
          class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        >
          취소
        </button>
        <button
          @click="confirmDelete"
          :disabled="favoriteStore.loading"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          <Loader v-if="favoriteStore.loading" class="w-4 h-4 animate-spin mr-2" />
          삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Plus, Users, Edit, Trash2, Star, Loader, AlertCircle, ArrowRight } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import { useFavoriteApprovalStore } from '@/stores/useFavoriteApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import FavoriteGroupFormModal from './FavoriteGroupFormModal.vue';

const favoriteStore = useFavoriteApprovalStore();
const userStore = useUserStore();
const toast = useToast();

// 상태 관리
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const editingGroup = ref(null);
const deletingGroup = ref(null);


// 날짜 포맷 함수
const formatDate = (dateString) => {
  if (!dateString) return '알 수 없음';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '알 수 없음';
  }
};

// 편집 핸들러
const handleEdit = (group) => {
  editingGroup.value = group;
  showCreateModal.value = true;
};

// 삭제 핸들러
const handleDelete = (group) => {
  deletingGroup.value = group;
  showDeleteModal.value = true;
};

// 삭제 확인
const confirmDelete = async () => {
  try {
    await favoriteStore.deleteFavoriteGroup(deletingGroup.value.id);
    toast.success(`"${deletingGroup.value.name}" 그룹이 삭제되었습니다.`);
    showDeleteModal.value = false;
    deletingGroup.value = null;
  } catch (error) {
    toast.error('그룹 삭제에 실패했습니다.');
  }
};

// 모달 닫기
const handleCloseModal = () => {
  showCreateModal.value = false;
  editingGroup.value = null;
  favoriteStore.clearError();
};

// 그룹 저장
const handleSaveGroup = async (groupData) => {
  try {
    if (editingGroup.value) {
      // 편집 모드
      await favoriteStore.updateFavoriteGroup(editingGroup.value.id, groupData);
      toast.success(`"${groupData.name}" 그룹이 수정되었습니다.`);
    } else {
      // 생성 모드
      await favoriteStore.createFavoriteGroup(groupData.name, groupData.approverIds);
      toast.success(`"${groupData.name}" 그룹이 생성되었습니다.`);
    }
    handleCloseModal();
  } catch (error) {
    toast.error(editingGroup.value ? '그룹 수정에 실패했습니다.' : '그룹 생성에 실패했습니다.');
  }
};

// 초기 데이터 로드
onMounted(async () => {
  await favoriteStore.fetchFavoriteGroups();
});
</script>