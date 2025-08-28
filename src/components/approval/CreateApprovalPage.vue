<template>
  <div class="space-y-6">
    <!-- 뒤로 가기 버튼과 제목 -->
    <div class="flex items-center space-x-4 mb-6">
      <button
        @click="goBack"
        class="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
      >
        <ChevronLeft class="w-4 h-4 mr-1" />
        뒤로
      </button>
      <h2 class="text-xl font-semibold text-gray-900">결재 요청 작성</h2>
    </div>
    <!-- 진행 단계 표시 -->
    <div class="mb-8">
        <div class="flex items-center space-x-4">
          <div 
            class="flex items-center"
            :class="step >= 1 ? 'text-blue-600' : 'text-gray-400'"
          >
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium"
                 :class="step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'">
              1
            </div>
            <span class="ml-2">기본 정보 & 첨부파일</span>
          </div>
          <div class="flex-1 h-0.5" :class="step >= 2 ? 'bg-blue-600' : 'bg-gray-300'"></div>
          <div 
            class="flex items-center"
            :class="step >= 2 ? 'text-blue-600' : 'text-gray-400'"
          >
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium"
                 :class="step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'">
              2
            </div>
            <span class="ml-2">결재선 설정</span>
          </div>
          <div class="flex-1 h-0.5" :class="step >= 3 ? 'bg-blue-600' : 'bg-gray-300'"></div>
          <div 
            class="flex items-center"
            :class="step >= 3 ? 'text-blue-600' : 'text-gray-400'"
          >
            <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium"
                 :class="step >= 3 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'">
              3
            </div>
            <span class="ml-2">최종 확인</span>
          </div>
      </div>
    </div>

    <!-- 폼 컨테이너 -->
    <div class="bg-white rounded-lg shadow-sm p-6">
        <!-- Step 1: 기본 정보 -->
        <div v-if="step === 1" class="space-y-6">
          <!-- 템플릿 선택 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              결재 양식 선택 (선택사항)
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                @click="selectedTemplate = null"
                class="p-4 border rounded-lg cursor-pointer transition-colors"
                :class="selectedTemplate === null ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="font-medium">자유 작성</div>
                <div class="text-sm text-gray-500">템플릿 없이 자유롭게 작성</div>
              </div>
              <div
                v-for="template in templates"
                :key="template.id"
                @click="selectedTemplate = template"
                class="p-4 border rounded-lg cursor-pointer transition-colors"
                :class="selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
              >
                <div class="font-medium">{{ template.name }}</div>
                <div class="text-sm text-gray-500">{{ template.description }}</div>
              </div>
            </div>
          </div>

          <!-- 제목 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              제목 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="결재 제목을 입력하세요"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- 내용 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              내용 <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="formData.content"
              rows="8"
              placeholder="결재 내용을 입력하세요"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <!-- 템플릿 추가 필드들 -->
          <div v-if="selectedTemplate && selectedTemplate.form_fields" class="space-y-4">
            <h4 class="font-medium text-gray-900">추가 정보</h4>
            <div
              v-for="field in selectedTemplate.form_fields"
              :key="field.name"
              class="space-y-2"
            >
              <label class="block text-sm font-medium text-gray-700">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              
              <!-- 텍스트 입력 -->
              <input
                v-if="field.type === 'text'"
                v-model="formData.form_data[field.name]"
                type="text"
                :placeholder="field.placeholder"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <!-- 숫자 입력 -->
              <input
                v-else-if="field.type === 'number'"
                v-model.number="formData.form_data[field.name]"
                type="number"
                :placeholder="field.placeholder"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <!-- 날짜 입력 -->
              <input
                v-else-if="field.type === 'date'"
                v-model="formData.form_data[field.name]"
                type="date"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <!-- 선택 입력 -->
              <select
                v-else-if="field.type === 'select'"
                v-model="formData.form_data[field.name]"
                :required="field.required"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">선택하세요</option>
                <option
                  v-for="option in field.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- 첨부파일 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              첨부파일 (선택사항)
            </label>
            <div 
              class="border-2 border-dashed rounded-lg p-6 text-center transition-colors"
              :class="isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragenter="handleDragEnter"
              @dragleave="handleDragLeave"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                @change="handleFileSelect"
                class="hidden"
              />
              <Upload class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 mb-2">파일을 드래그하거나 클릭하여 업로드</p>
              <button
                @click="$refs.fileInput.click()"
                class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                파일 선택
              </button>
              <p class="text-xs text-gray-400 mt-2">최대 20MB, 모든 파일 형식 지원</p>
            </div>
          </div>

          <!-- 선택된 파일 목록 -->
          <div v-if="selectedFiles.length > 0" class="space-y-2">
            <h5 class="font-medium text-gray-900">선택된 파일</h5>
            <div
              v-for="(file, index) in selectedFiles"
              :key="`file-${index}`"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div class="flex items-center space-x-3">
                <component :is="getFileIcon(file.name)" class="w-5 h-5 text-gray-400" />
                <div>
                  <div class="font-medium">{{ file.name }}</div>
                  <div class="text-sm text-gray-500">{{ formatFileSize(file.size) }}</div>
                </div>
              </div>
              <button
                @click="removeFile(index)"
                class="text-red-400 hover:text-red-600"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: 결재선 설정 -->
        <div v-if="step === 2" class="space-y-6">
          <div class="text-center py-8">
            <Users class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 class="text-lg font-medium text-gray-900 mb-2">결재선 설정</h4>
            <p class="text-gray-500 mb-6">결재자를 선택하고 순서를 정해주세요.</p>
            
            <button
              @click="showApprovalLineModal = true"
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus class="w-4 h-4 mr-2" />
              결재선 설정
            </button>
          </div>

          <!-- 설정된 결재선 미리보기 -->
          <div v-if="approvalLines.length > 0" class="mt-6">
            <h5 class="font-medium text-gray-900 mb-3">설정된 결재선</h5>
            <div class="flex items-center space-x-2 overflow-x-auto pb-2">
              <div
                v-for="(line, index) in approvalLines"
                :key="`preview-${index}`"
                class="flex items-center space-x-2 flex-shrink-0"
              >
                <!-- 결재자 카드 -->
                <div class="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div class="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {{ index + 1 }}
                  </div>
                  <div class="text-sm">
                    <div class="font-medium">{{ line.approver_name }}</div>
                  </div>
                  <span v-if="!line.is_required" class="px-1 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                    선택
                  </span>
                </div>
                
                <!-- 화살표 (마지막이 아닌 경우) -->
                <ArrowRight v-if="index < approvalLines.length - 1" class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: 최종 확인 -->
        <div v-if="step === 3" class="space-y-6">
          <!-- 작성 내용 요약 -->
          <div class="bg-gray-50 rounded-lg p-6">
            <h4 class="font-semibold text-gray-900 mb-4">결재 요청 내용 확인</h4>
            
            <div class="space-y-4">
              <!-- 기본 정보 -->
              <div>
                <h5 class="font-medium text-gray-700 mb-2">기본 정보</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">양식:</span>
                    <span class="ml-2">{{ selectedTemplate?.name || '자유 작성' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-500">제목:</span>
                    <span class="ml-2">{{ formData.title }}</span>
                  </div>
                </div>
                <div class="mt-2">
                  <span class="text-gray-500">내용:</span>
                  <div class="ml-2 mt-1 p-2 bg-white border rounded text-sm">
                    {{ formData.content }}
                  </div>
                </div>
              </div>

              <!-- 결재선 -->
              <div>
                <h5 class="font-medium text-gray-700 mb-2">결재선 ({{ approvalLines.length }}명)</h5>
                <div class="flex items-center space-x-2 overflow-x-auto pb-2">
                  <div
                    v-for="(line, index) in approvalLines"
                    :key="`final-${index}`"
                    class="flex items-center space-x-2 flex-shrink-0"
                  >
                    <div class="flex items-center space-x-2 p-2 bg-white border border-gray-200 rounded-md">
                      <div class="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                        {{ index + 1 }}
                      </div>
                      <div class="text-sm">
                        <div class="font-medium">{{ line.approver_name }}</div>
                      </div>
                    </div>
                    <ArrowRight v-if="index < approvalLines.length - 1" class="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>

              <!-- 첨부파일 -->
              <div v-if="selectedFiles.length > 0">
                <h5 class="font-medium text-gray-700 mb-2">첨부파일 ({{ selectedFiles.length }}개)</h5>
                <div class="space-y-2">
                  <div
                    v-for="(file, index) in selectedFiles"
                    :key="`final-file-${index}`"
                    class="flex items-center space-x-3 p-2 bg-white border border-gray-200 rounded-md"
                  >
                    <component :is="getFileIcon(file.name)" class="w-4 h-4 text-gray-400" />
                    <div class="text-sm">
                      <div>{{ file.name }}</div>
                      <div class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="flex justify-between items-center mt-8 pt-6 border-t">
          <button
            v-if="step > 1"
            @click="step--"
            class="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <ChevronLeft class="w-4 h-4 mr-2" />
            이전
          </button>
          <div v-else></div>

          <div class="flex space-x-3">
            <!-- 다음/완료 버튼 -->
            <button
              v-if="step < 3"
              @click="nextStep"
              :disabled="!canProceed"
              class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              다음
              <ChevronRight class="w-4 h-4 ml-2" />
            </button>
            
            <button
              v-else
              @click="submitApproval"
              :disabled="loading || !canComplete"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
              결재 상신
            </button>
          </div>
      </div>
    </div>

    <!-- 결재선 설정 모달 -->
    <ApprovalLineModal
      :is-visible="showApprovalLineModal"
      :initial-lines="approvalLines"
      @close="showApprovalLineModal = false"
      @save="handleApprovalLineSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { ChevronLeft, ChevronRight, Users, Plus, Upload, Trash2, FileText, File, Loader, ArrowRight } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { approvalUtils } from '@/utils/approvalApi';
import ApprovalLineModal from './ApprovalLineModal.vue';

const emit = defineEmits(['created', 'cancel']);
const templateStore = useTemplateStore();
const approvalStore = useApprovalStore();
const toast = useToast();

// 상태 관리
const step = ref(1);
const loading = ref(false);
const selectedTemplate = ref(null);
const showApprovalLineModal = ref(false);
const selectedFiles = ref([]);
const fileInput = ref(null);
const isDragOver = ref(false);

// 폼 데이터
const formData = ref({
  title: '',
  content: '',
  template_id: null,
  form_data: {},
});

const approvalLines = ref([]);
const templates = ref([]);

// 뒤로 가기 (부모 컴포넌트에서 탭 변경으로 처리)
const goBack = () => {
  // 부모 컴포넌트에서 탭을 변경하도록 이벤트 emit
  emit('cancel');
};

// 초기화
const resetForm = () => {
  step.value = 1;
  selectedTemplate.value = null;
  formData.value = {
    title: '',
    content: '',
    template_id: null,
    form_data: {},
  };
  approvalLines.value = [];
  selectedFiles.value = [];
};

const loadTemplates = async () => {
  try {
    const data = await templateStore.fetchTemplates();
    templates.value = data.filter(t => t.is_active);
  } catch (error) {
    console.error('템플릿 로드 오류:', error);
  }
};

// 템플릿 선택 시 기본 결재선 적용
watch(selectedTemplate, async (newTemplate) => {
  if (newTemplate) {
    formData.value.template_id = newTemplate.id;
    // 기본 결재선이 있으면 적용
    if (newTemplate.default_approval_steps?.length > 0) {
      const lines = [];
      
      // 각 단계의 실제 사용자 정보를 조회
      for (const step of newTemplate.default_approval_steps) {
        const lineData = {
          approver_id: step.approver_id,
          approver_user_id: step.approver_user_id,
          step_order: step.step_order,
          is_required: step.is_required,
          is_parallel: step.is_parallel,
          approver_name: step.approver_name || '결재자',
          approver_department: step.approver_department || '',
          approver_position: step.approver_position || '',
        };
        
        lines.push(lineData);
      }
      
      approvalLines.value = lines;
    }
    
    // 템플릿 필드 초기화
    if (newTemplate.form_fields) {
      newTemplate.form_fields.forEach(field => {
        formData.value.form_data[field.name] = field.default_value || '';
      });
    }
  } else {
    formData.value.template_id = null;
    formData.value.form_data = {};
  }
});

// 단계별 진행 조건
const canProceed = computed(() => {
  if (step.value === 1) {
    return formData.value.title.trim() && formData.value.content.trim();
  }
  if (step.value === 2) {
    return approvalLines.value.length > 0;
  }
  return true;
});

const canComplete = computed(() => {
  return formData.value.title.trim() && 
         formData.value.content.trim() && 
         approvalLines.value.length > 0;
});

// 파일 관련 함수들
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  addFiles(files);
};

// 드래그 앤 드롭 핸들러들
const handleDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
};

const handleDragEnter = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  // 드롭 영역을 완전히 벗어났을 때만 상태 변경
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false;
  }
};

const handleDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
};

// 파일 추가 공통 함수
const addFiles = (files) => {
  // 20MB 크기 제한 체크
  const maxSize = 20 * 1024 * 1024; // 20MB
  const validFiles = files.filter(file => {
    if (file.size > maxSize) {
      toast.error(`${file.name}은(는) 20MB를 초과합니다.`);
      return false;
    }
    return true;
  });
  
  // 중복 파일 체크
  const existingNames = new Set(selectedFiles.value.map(f => f.name));
  const newFiles = validFiles.filter(file => {
    if (existingNames.has(file.name)) {
      toast.error(`${file.name}은(는) 이미 추가된 파일입니다.`);
      return false;
    }
    return true;
  });
  
  selectedFiles.value.push(...newFiles);
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return FileText;
  }
  return File;
};

const formatFileSize = (bytes) => {
  return approvalUtils.formatFileSize(bytes);
};

// 단계 이동
const nextStep = () => {
  if (step.value === 2 && approvalLines.value.length === 0) {
    toast.warning('결재선을 설정해주세요.');
    return;
  }
  
  if (canProceed.value && step.value < 3) {
    step.value++;
  }
};

// 결재선 설정 저장
const handleApprovalLineSave = (lines) => {
  approvalLines.value = lines;
  showApprovalLineModal.value = false;
};

// 결재 상신
const submitApproval = async () => {
  if (!canComplete.value) {
    toast.error('필수 정보를 모두 입력해주세요.');
    return;
  }
  
  loading.value = true;
  try {
    const requestData = {
      ...formData.value,
      approval_lines: approvalLines.value,
    };
    
    const result = await approvalStore.createApprovalRequest(requestData, selectedFiles.value);
    
    toast.success('결재가 상신되었습니다.');
    emit('created', result);
  } catch (error) {
    toast.error('결재 상신 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 초기 로드
onMounted(() => {
  resetForm();
  loadTemplates();
});
</script>