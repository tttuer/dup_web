<template>
  <div class="space-y-6">
    <!-- 헤더 -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">결재 양식 관리</h2>
        <p class="text-gray-600 mt-1">결재 양식을 생성하고 관리합니다.</p>
      </div>
      
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
      >
        <Plus class="w-4 h-4 mr-2" />
        새 양식 만들기
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading && templates.length === 0" class="flex justify-center py-12">
      <Loader class="w-8 h-8 animate-spin text-blue-600" />
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="templates.length === 0" class="text-center py-12">
      <FileText class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">등록된 양식이 없습니다</h3>
      <p class="text-gray-500 mb-6">새로운 결재 양식을 만들어보세요.</p>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <Plus class="w-4 h-4 mr-2" />
        양식 만들기
      </button>
    </div>

    <!-- 양식 목록 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templates"
        :key="template.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-medium text-gray-900 mb-2">{{ template.name }}</h3>
              <p class="text-gray-600 text-sm mb-3">{{ template.description }}</p>
              
              <!-- 카테고리 및 상태 -->
              <div class="flex items-center space-x-2 mb-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {{ template.category }}
                </span>
                <span 
                  v-if="template.is_active"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  활성
                </span>
                <span 
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  비활성
                </span>
              </div>
              
              <!-- 기본 결재선 정보 -->
              <div v-if="template.default_approval_steps?.length > 0" class="text-sm text-gray-500">
                기본 결재선: {{ template.default_approval_steps.length }}단계
              </div>
            </div>
            
            <!-- 드롭다운 메뉴 -->
            <div class="relative">
              <button
                @click="toggleDropdown(template.id)"
                class="p-2 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical class="w-4 h-4" />
              </button>
              
              <div
                v-if="activeDropdown === template.id"
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"
              >
                <button
                  @click="editTemplate(template)"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit class="w-4 h-4 inline mr-2" />
                  수정
                </button>
                <button
                  @click="toggleTemplateStatus(template)"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <component :is="template.is_active ? 'Pause' : 'Play'" class="w-4 h-4 inline mr-2" />
                  {{ template.is_active ? '비활성화' : '활성화' }}
                </button>
                <button
                  @click="duplicateTemplate(template)"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Copy class="w-4 h-4 inline mr-2" />
                  복사
                </button>
                <button
                  @click="deleteTemplate(template)"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 class="w-4 h-4 inline mr-2" />
                  삭제
                </button>
              </div>
            </div>
          </div>
          
          <!-- 사용 통계 (가상 데이터) -->
          <div class="border-t pt-4">
            <div class="flex justify-between text-sm text-gray-500">
              <span>사용 횟수</span>
              <span>{{ Math.floor(Math.random() * 100) }}회</span>
            </div>
            <div class="flex justify-between text-sm text-gray-500 mt-1">
              <span>생성일</span>
              <span>{{ formatDate(template.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 양식 생성/편집 모달 -->
    <TemplateFormModal
      :is-visible="showCreateModal || showEditModal"
      :template="editingTemplate"
      @close="closeModal"
      @saved="handleTemplateSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, Loader, FileText, MoreVertical, Edit, Pause, Play, Copy, Trash2 } from 'lucide-vue-next';
import { useTemplateStore } from '@/stores/useTemplateStore';
import TemplateFormModal from './TemplateFormModal.vue';

const templateStore = useTemplateStore();

// 상태 관리
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingTemplate = ref(null);
const activeDropdown = ref(null);

// 데이터
const templates = computed(() => templateStore.templates);

// 데이터 로드
const loadTemplates = async () => {
  loading.value = true;
  try {
    await templateStore.fetchTemplates();
  } catch (error) {
    console.error('템플릿 로드 오류:', error);
  } finally {
    loading.value = false;
  }
};

// 드롭다운 토글
const toggleDropdown = (templateId) => {
  activeDropdown.value = activeDropdown.value === templateId ? null : templateId;
};

// 템플릿 편집
const editTemplate = (template) => {
  editingTemplate.value = { ...template };
  showEditModal.value = true;
  activeDropdown.value = null;
};

// 템플릿 상태 토글
const toggleTemplateStatus = async (template) => {
  try {
    await templateStore.updateTemplate(template.id, {
      ...template,
      is_active: !template.is_active,
    });
    await loadTemplates();
  } catch (error) {
    alert('상태 변경 중 오류가 발생했습니다: ' + error.message);
  }
  activeDropdown.value = null;
};

// 템플릿 복사
const duplicateTemplate = async (template) => {
  try {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (복사본)`,
      id: undefined, // 새로운 ID 생성을 위해 제거
    };
    delete duplicatedTemplate.id;
    delete duplicatedTemplate.created_at;
    delete duplicatedTemplate.updated_at;
    
    await templateStore.createTemplate(duplicatedTemplate);
    await loadTemplates();
  } catch (error) {
    alert('템플릿 복사 중 오류가 발생했습니다: ' + error.message);
  }
  activeDropdown.value = null;
};

// 템플릿 삭제
const deleteTemplate = async (template) => {
  if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) return;
  
  try {
    await templateStore.deleteTemplate(template.id);
    await loadTemplates();
  } catch (error) {
    alert('템플릿 삭제 중 오류가 발생했습니다: ' + error.message);
  }
  activeDropdown.value = null;
};

// 모달 닫기
const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingTemplate.value = null;
};

// 템플릿 저장 완료 핸들러
const handleTemplateSaved = () => {
  closeModal();
  loadTemplates();
};

// 유틸리티 함수
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ko-KR');
};

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', (event) => {
  if (!event.target.closest('.relative')) {
    activeDropdown.value = null;
  }
});

// 초기 데이터 로드
onMounted(() => {
  loadTemplates();
});
</script>