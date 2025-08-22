<template>
  <div 
    v-if="isVisible" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- 헤더 -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold">
          {{ isEdit ? '양식 수정' : '새 양식 만들기' }}
        </h3>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- 폼 -->
      <form @submit.prevent="saveTemplate" class="space-y-6">
        <!-- 기본 정보 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              양식명 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="예: 업무기안서"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              카테고리 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              <option value="업무">업무</option>
              <option value="지출">지출</option>
              <option value="인사">인사</option>
              <option value="총무">총무</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            설명
          </label>
          <textarea
            v-model="formData.description"
            rows="3"
            placeholder="양식에 대한 설명을 입력하세요"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            문서번호 프리픽스
          </label>
          <input
            v-model="formData.document_prefix"
            type="text"
            placeholder="예: 업무기안"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="text-xs text-gray-500 mt-1">
            문서번호 형식: {프리픽스}-{년도}-{월일}-{고유번호}
          </p>
        </div>

        <!-- 기본 결재선 설정 -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700">
              기본 결재선
            </label>
            <button
              type="button"
              @click="addApprovalStep"
              class="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              <Plus class="w-4 h-4 mr-1" />
              단계 추가
            </button>
          </div>
          
          <div v-if="formData.default_approval_steps.length === 0" class="text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
            기본 결재선을 설정하지 않으면 사용자가 직접 설정해야 합니다.
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(step, index) in formData.default_approval_steps"
              :key="`step-${index}`"
              class="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
            >
              <!-- 순서 -->
              <div class="flex items-center space-x-2">
                <button
                  type="button"
                  @click="moveStepUp(index)"
                  :disabled="index === 0"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp class="w-4 h-4" />
                </button>
                <span class="w-6 text-center text-sm font-medium">{{ index + 1 }}</span>
                <button
                  type="button"
                  @click="moveStepDown(index)"
                  :disabled="index === formData.default_approval_steps.length - 1"
                  class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown class="w-4 h-4" />
                </button>
              </div>
              
              <!-- 결재자 설정 -->
              <div class="flex-1">
                <input
                  v-model="step.approver_id"
                  type="text"
                  placeholder="결재자 ID 또는 직책명 (예: CEO, 팀장)"
                  class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <!-- 옵션 -->
              <div class="flex items-center space-x-2">
                <label class="flex items-center text-sm">
                  <input
                    v-model="step.is_required"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-1">필수</span>
                </label>
                
                <label class="flex items-center text-sm">
                  <input
                    v-model="step.is_parallel"
                    type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="ml-1">병렬</span>
                </label>
              </div>
              
              <!-- 삭제 버튼 -->
              <button
                type="button"
                @click="removeApprovalStep(index)"
                class="p-1 text-red-400 hover:text-red-600"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 활성 상태 -->
        <div class="flex items-center">
          <input
            v-model="formData.is_active"
            type="checkbox"
            id="is_active"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="is_active" class="ml-2 text-sm text-gray-700">
            활성 상태 (체크하면 사용자가 선택할 수 있습니다)
          </label>
        </div>

        <!-- 버튼 -->
        <div class="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            :disabled="loading || !canSave"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
            {{ isEdit ? '수정' : '생성' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { X, Plus, ChevronUp, ChevronDown, Trash2, Loader } from 'lucide-vue-next';
import { useTemplateStore } from '@/stores/useTemplateStore';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  template: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'saved']);

const templateStore = useTemplateStore();

// 상태 관리
const loading = ref(false);

// 폼 데이터
const formData = ref({
  name: '',
  description: '',
  category: '',
  document_prefix: '',
  default_approval_steps: [],
  is_active: true,
});

// 편집 모드 여부
const isEdit = computed(() => !!props.template);

// 저장 가능 여부
const canSave = computed(() => {
  return formData.value.name.trim() && formData.value.category;
});

// 초기화
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    category: '',
    document_prefix: '',
    default_approval_steps: [],
    is_active: true,
  };
};

// 템플릿 데이터로 폼 초기화
const initializeForm = () => {
  if (props.template) {
    formData.value = {
      name: props.template.name || '',
      description: props.template.description || '',
      category: props.template.category || '',
      document_prefix: props.template.document_prefix || '',
      default_approval_steps: props.template.default_approval_steps 
        ? [...props.template.default_approval_steps]
        : [],
      is_active: props.template.is_active !== false,
    };
  } else {
    resetForm();
  }
};

// 결재 단계 추가
const addApprovalStep = () => {
  formData.value.default_approval_steps.push({
    step_order: formData.value.default_approval_steps.length + 1,
    approver_id: '',
    is_required: true,
    is_parallel: false,
  });
  updateStepOrders();
};

// 결재 단계 제거
const removeApprovalStep = (index) => {
  formData.value.default_approval_steps.splice(index, 1);
  updateStepOrders();
};

// 단계 순서 업데이트
const updateStepOrders = () => {
  formData.value.default_approval_steps.forEach((step, index) => {
    step.step_order = index + 1;
  });
};

// 단계 위로 이동
const moveStepUp = (index) => {
  if (index > 0) {
    const temp = formData.value.default_approval_steps[index];
    formData.value.default_approval_steps[index] = formData.value.default_approval_steps[index - 1];
    formData.value.default_approval_steps[index - 1] = temp;
    updateStepOrders();
  }
};

// 단계 아래로 이동
const moveStepDown = (index) => {
  if (index < formData.value.default_approval_steps.length - 1) {
    const temp = formData.value.default_approval_steps[index];
    formData.value.default_approval_steps[index] = formData.value.default_approval_steps[index + 1];
    formData.value.default_approval_steps[index + 1] = temp;
    updateStepOrders();
  }
};

// 저장
const saveTemplate = async () => {
  if (!canSave.value) return;
  
  loading.value = true;
  try {
    const templateData = { ...formData.value };
    
    if (isEdit.value) {
      await templateStore.updateTemplate(props.template.id, templateData);
    } else {
      await templateStore.createTemplate(templateData);
    }
    
    emit('saved');
  } catch (error) {
    alert((isEdit.value ? '수정' : '생성') + ' 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 모달 닫기
const closeModal = () => {
  emit('close');
};

// 감시자
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    initializeForm();
  }
});

watch(() => props.template, () => {
  if (props.isVisible) {
    initializeForm();
  }
});
</script>