<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-gray-900">즐겨찾기 그룹 관리</h3>
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

    <!-- 즐겨찾기 그룹 목록 -->
    <div v-else-if="favoriteStore.hasFavoriteGroups" class="grid gap-4">
      <div
        v-for="group in favoriteStore.favoriteGroups"
        :key="group.id"
        class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 mb-2">{{ group.name }}</h4>
            <div class="flex items-center space-x-2 mb-3">
              <Users class="w-4 h-4 text-gray-400" />
              <span class="text-sm text-gray-600">{{ group.approver_ids.length }}명</span>
            </div>
            
            <!-- 결재자 목록 -->
            <div class="flex flex-wrap gap-2">
              <div
                v-for="approverId in group.approver_ids"
                :key="approverId"
                class="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {{ getUserName(approverId) }}
              </div>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="flex items-center space-x-2 ml-4">
            <button
              @click="handleEdit(group)"
              class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="편집"
            >
              <Edit class="w-4 h-4" />
            </button>
            <button
              @click="handleDelete(group)"
              class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="삭제"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 비어있는 상태 -->
    <div v-else class="text-center py-12">
      <Star class="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">즐겨찾기 그룹이 없습니다</h3>
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
import { Plus, Users, Edit, Trash2, Star, Loader, AlertCircle } from 'lucide-vue-next';
import { useFavoriteApprovalStore } from '@/stores/useFavoriteApprovalStore';
import { useUserStore } from '@/stores/useUserStore';
import FavoriteGroupFormModal from './FavoriteGroupFormModal.vue';

const favoriteStore = useFavoriteApprovalStore();
const userStore = useUserStore();

// 상태 관리
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const editingGroup = ref(null);
const deletingGroup = ref(null);

// 사용자 이름 조회
const getUserName = (userId) => {
  const user = userStore.approvers.find(u => u.id === userId);
  return user ? user.name : userId;
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
    showDeleteModal.value = false;
    deletingGroup.value = null;
  } catch (error) {
    // 에러는 스토어에서 처리됨
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
    } else {
      // 생성 모드
      await favoriteStore.createFavoriteGroup(groupData.name, groupData.approverIds);
    }
    handleCloseModal();
  } catch (error) {
    // 에러는 스토어에서 처리되고 모달에 표시됨
  }
};

// 초기 데이터 로드
onMounted(async () => {
  await favoriteStore.fetchFavoriteGroups();
});
</script>