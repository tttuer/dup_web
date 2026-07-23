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
    <div v-if="!isPaymentRequest" class="mb-8">
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
          <div v-if="!isPaymentRequest">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
              <label class="block text-sm font-medium text-gray-700">
                결재 양식 선택 (선택사항)
              </label>
              <!-- 검색창 -->
              <div class="relative max-w-xs w-full">
                <input
                  v-model="templateSearchQuery"
                  type="text"
                  placeholder="양식 이름 검색..."
                  class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search class="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <!-- 카테고리 탭 -->
            <div class="flex space-x-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
              <button
                @click="selectedCategory = 'all'"
                :class="['px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors border', selectedCategory === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50']"
              >
                전체
              </button>
              <button
                v-for="cat in templateCategories"
                :key="cat"
                @click="selectedCategory = cat"
                :class="['px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors border', selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50']"
              >
                {{ cat }}
              </button>
            </div>

            <!-- 양식 목록 그리드 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1 bg-gray-50/50 rounded-lg border border-gray-100">
              <div
                @click="selectPaymentRequest"
                class="p-4 bg-white border rounded-lg cursor-pointer transition-all shadow-sm hover:shadow"
                :class="isPaymentRequest ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'"
              >
                <div class="font-medium text-gray-900 mb-1">납부 요청</div>
                <div class="text-xs text-gray-500">기한·금액·납부 담당자를 지정하는 간편 결재</div>
              </div>
              <div
                @click="handleTemplateSelect(null)"
                class="p-4 bg-white border rounded-lg cursor-pointer transition-all shadow-sm hover:shadow"
                :class="selectedTemplate === null && !isPaymentRequest ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'"
              >
                <div class="font-medium text-gray-900 mb-1">자유 작성</div>
                <div class="text-xs text-gray-500">템플릿 없이 자유롭게 작성</div>
              </div>
              <div
                v-for="template in filteredTemplates"
                :key="template.id"
                @click="handleTemplateSelect(template)"
                class="p-4 bg-white border rounded-lg cursor-pointer transition-all shadow-sm hover:shadow"
                :class="selectedTemplate?.id === template.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'"
              >
                <div class="flex justify-between items-start mb-1 gap-2">
                  <div class="font-medium text-gray-900 line-clamp-1">{{ template.name }}</div>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 shrink-0">
                    {{ template.category }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 line-clamp-2">{{ template.description || '설명이 없습니다.' }}</div>
              </div>
            </div>
            
            <div v-if="filteredTemplates.length === 0" class="text-center py-8 text-gray-500 text-sm border border-dashed rounded-lg mt-2 bg-gray-50">
              검색 조건에 맞는 양식이 없습니다.
            </div>
          </div>

          <div v-if="isPaymentRequest" class="space-y-4 rounded-lg border border-blue-100 bg-blue-50/50 p-5">
            <div>
              <h3 class="font-medium text-gray-900">납부 정보</h3>
              <p class="mt-1 text-sm text-gray-600">최종 승인되면 지정 담당자의 ‘납부할 업무’에 자동으로 생성됩니다.</p>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label class="block text-sm font-medium text-gray-700">
                납부 업무명
                <input v-model="paymentRequest.name" type="text" placeholder="예: 2026년 1기 부가세" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label class="block text-sm font-medium text-gray-700">
                분류
                <input v-model="paymentRequest.category" type="text" placeholder="예: 세금, 거래처 지급" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label class="block text-sm font-medium text-gray-700">
                요청 금액
                <input :value="formatAmountInput(paymentRequest.amount)" inputmode="numeric" type="text" placeholder="금액을 입력하세요" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" @input="updateAmountInput($event, value => (paymentRequest.amount = value))" />
              </label>
              <label class="block text-sm font-medium text-gray-700">
                납부 기한
                <input v-model="paymentRequest.due_date" type="date" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label class="block text-sm font-medium text-gray-700 md:col-span-2">
                납부 담당자 <span class="text-red-500">*</span>
                <select v-model="paymentRequest.assignee_id" class="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2">
                  <option value="">담당자를 선택하세요</option>
                  <option v-for="user in userStore.users" :key="user.user_id" :value="user.user_id">
                    {{ user.name }} ({{ user.user_id }})
                  </option>
                </select>
                <span class="mt-1 block text-xs font-normal text-gray-500">처음 선택한 담당자는 다음 납부 요청에도 기본값으로 적용됩니다.</span>
              </label>
            </div>
            <p class="rounded-md bg-white px-3 py-2 text-sm text-gray-600">
              자동 제목: <span class="font-medium text-gray-900">{{ paymentTitlePreview }}</span>
            </p>
          </div>

          <!-- 제목 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              제목 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.title"
              type="text"
              :placeholder="isPaymentRequest ? '납부 정보 입력 시 자동 생성됩니다' : '결재 제목을 입력하세요'"
              :readonly="isPaymentRequest"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 read-only:bg-gray-50"
              required
            />
          </div>

          <!-- 내용 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ isPaymentRequest ? '요청 사유·참고사항 (선택)' : '내용' }}<span v-if="!isPaymentRequest" class="text-red-500"> *</span>
            </label>
            <textarea
              v-model="formData.content"
              rows="8"
              :placeholder="isPaymentRequest ? '납부 근거, 고지서 안내 등 필요한 내용을 입력하세요' : '결재 내용을 입력하세요'"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              :required="!isPaymentRequest"
            ></textarea>
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
            
            <!-- 에러 메시지 -->
            <div v-if="hasInvalidApprovers" class="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              <span class="font-medium">결재선 오류:</span> 올바른 사용자가 지정되지 않은 결재 단계가 있습니다. '결재선 설정'을 눌러 실제 사용자로 다시 지정해주세요.
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
                <!-- 에러 메시지 -->
                <div v-if="hasInvalidApprovers" class="mt-3 text-red-600 text-sm">
                  ⚠️ 결재선에 올바르지 않은 사용자가 있습니다. 수정을 위해 이전 단계로 돌아가주세요.
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
            v-if="step > 1 && !isPaymentRequest"
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
              v-if="isPaymentRequest"
              @click="submitPaymentRequest"
              :disabled="loading || !hasValidPaymentRequest"
              class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin mr-2" />
              납부 요청 등록
            </button>
            <button
              v-else-if="step < 3"
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

    <!-- 템플릿 변경 확인 모달 -->
    <div
      v-if="showTemplateConfirmModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm"
      @click.self="showTemplateConfirmModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div class="flex items-center space-x-3 text-yellow-600 mb-4">
          <AlertTriangle class="w-6 h-6" />
          <h3 class="text-lg font-semibold text-gray-900">양식 덮어쓰기 안내</h3>
        </div>
        <p class="text-gray-600 text-sm mb-6">
          새 양식을 선택하면 현재 작성 중이던 내용과 결재선이 새 양식의 내용으로 덮어씌워집니다. 계속하시겠습니까?
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showTemplateConfirmModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            취소
          </button>
          <button
            @click="confirmTemplateChange"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { ChevronLeft, ChevronRight, Users, Plus, Upload, Trash2, FileText, File, Loader, ArrowRight, Search, AlertTriangle } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import { useTemplateStore } from '@/stores/useTemplateStore';
import { useApprovalStore } from '@/stores/useApprovalStore';
import { approvalUtils, fileApi, paymentTaskApi } from '@/utils/approvalApi';
import ApprovalLineModal from './ApprovalLineModal.vue';
import { useUserStore } from '@/stores/useUserStore';

const props = defineProps({
  editRequestId: {
    type: String,
    default: null
  }
});
const emit = defineEmits(['created', 'cancel']);
const templateStore = useTemplateStore();
const approvalStore = useApprovalStore();
const userStore = useUserStore();
const toast = useToast();

// 상태 관리
const step = ref(1);
const loading = ref(false);
const selectedTemplate = ref(null);
const showApprovalLineModal = ref(false);
const showTemplateConfirmModal = ref(false);
const pendingTemplate = ref(null);
const selectedFiles = ref([]);
const deletedFileIds = ref([]);
const fileInput = ref(null);
const isDragOver = ref(false);
const isPaymentRequest = ref(false);
const PAYMENT_ASSIGNEE_STORAGE_KEY = 'payment_request_default_assignee_id';
const createPaymentRequest = () => ({
  name: '',
  category: '',
  amount: null,
  due_date: '',
  assignee_id: localStorage.getItem(PAYMENT_ASSIGNEE_STORAGE_KEY) || '',
});
const paymentRequest = ref(createPaymentRequest());

// 폼 데이터
const formData = ref({
  title: '',
  content: '',
  files: [],
});

const approvalLines = ref([]);
const templates = ref([]);
const templateSearchQuery = ref('');
const selectedCategory = ref('all');

const paymentTitlePreview = computed(() => {
  const parts = ['납부 요청'];
  if (paymentRequest.value.name.trim()) parts.push(paymentRequest.value.name.trim());
  if (paymentRequest.value.due_date) parts.push(paymentRequest.value.due_date);
  return parts.join(' - ');
});

const hasValidPaymentRequest = computed(() => {
  return Boolean(paymentRequest.value.assignee_id);
});

// 템플릿 필터링 로직
const templateCategories = computed(() => {
  const categories = new Set(templates.value.map(t => t.category));
  return Array.from(categories).sort();
});

const filteredTemplates = computed(() => {
  let result = templates.value;
  
  if (selectedCategory.value !== 'all') {
    result = result.filter(t => t.category === selectedCategory.value);
  }
  
  if (templateSearchQuery.value.trim()) {
    const query = templateSearchQuery.value.toLowerCase();
    result = result.filter(t => 
      t.name.toLowerCase().includes(query) || 
      (t.description && t.description.toLowerCase().includes(query))
    );
  }
  
  return result;
});

// 뒤로 가기 (부모 컴포넌트에서 탭 변경으로 처리)
const goBack = () => {
  // 부모 컴포넌트에서 탭을 변경하도록 이벤트 emit
  emit('cancel');
};

// 초기화
const resetForm = () => {
  step.value = 1;
  selectedTemplate.value = null;
  isPaymentRequest.value = false;
  paymentRequest.value = createPaymentRequest();
  formData.value = {
    title: '',
    content: '',
    files: [],
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

// 템플릿 선택 핸들러 (사용자 직접 클릭 시)
const handleTemplateSelect = (template) => {
  if (selectedTemplate.value?.id === template?.id) return;

  if (template) {
    const hasExistingData = formData.value.content.trim().length > 0 || approvalLines.value.length > 0;
    
    // 이미 작성된 내용이나 결재선이 있는 경우 경고창 모달 띄우기
    if (hasExistingData) {
      pendingTemplate.value = template;
      showTemplateConfirmModal.value = true;
      return;
    }

    applyTemplate(template);
  } else {
    // 자유 작성 선택
    selectedTemplate.value = null;
    isPaymentRequest.value = false;
    formData.value.template_id = '';
    // 기존 제목, 내용, 결재선은 유지
  }
};

const selectPaymentRequest = async () => {
  if (!isPaymentRequest.value) {
    const hasExistingData = formData.value.content.trim().length > 0 || approvalLines.value.length > 0;
    if (hasExistingData && !confirm('납부 요청으로 전환하면 기존 제목과 내용을 납부 요청 형식으로 사용합니다. 계속하시겠습니까?')) {
      return;
    }
  }
  selectedTemplate.value = null;
  formData.value.template_id = '';
  isPaymentRequest.value = true;
  await userStore.fetchAllUsers();
  syncPaymentTitle();
};

const syncPaymentTitle = () => {
  if (isPaymentRequest.value) {
    formData.value.title = paymentTitlePreview.value;
  }
};

const confirmTemplateChange = () => {
  if (pendingTemplate.value) {
    applyTemplate(pendingTemplate.value);
  }
  showTemplateConfirmModal.value = false;
  pendingTemplate.value = null;
};

const applyTemplate = (template) => {
  isPaymentRequest.value = false;
  selectedTemplate.value = template;
  formData.value.template_id = template.id;
  
  // 내용 템플릿 적용
  if (template.content_template) {
    formData.value.content = template.content_template;
  }

  // 기본 결재선이 있으면 적용 (확인했으므로 덮어씀)
  if (template.default_approval_steps?.length > 0) {
    const lines = [];
    
    const getCurrentUserFromToken = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        return null;
      }
    };
    
    const currentUser = getCurrentUserFromToken() || userStore.currentUser || {};
    // 토큰의 user_id, id, 혹은 sub를 사용
    const currentUserId = String(currentUser.user_id || currentUser.id || currentUser.sub);
    
    let removedSelf = false;
    
    for (const step of template.default_approval_steps) {
      const approverId = String(step.approver_user_id || step.approver_id);
      
      // 기안자 본인이 결재선에 포함되어 있다면 제외
      if (approverId === currentUserId) {
        removedSelf = true;
        continue;
      }

      const lineData = {
        approver_id: step.approver_user_id || step.approver_id,
        approver_user_id: step.approver_user_id || step.approver_id,
        step_order: lines.length + 1,
        is_required: step.is_required,
        is_parallel: step.is_parallel,
        approver_name: step.approver_name || '결재자',
        approver_department: step.approver_department || '',
        approver_position: step.approver_position || '',
      };
      
      lines.push(lineData);
    }
    
    if (removedSelf) {
      toast.info('기안자 본인은 양식의 결재선에서 자동 제외되었습니다.');
    }
    
    approvalLines.value = lines;
  }
};

// 단계별 진행 조건
const canProceed = computed(() => {
  if (step.value === 1) {
    return formData.value.title.trim() &&
      (isPaymentRequest.value ? hasValidPaymentRequest.value : formData.value.content.trim());
  }
  if (step.value === 2) {
    return approvalLines.value.length > 0;
  }
  return true;
});

const hasInvalidApprovers = computed(() => {
  return approvalLines.value.some(line => {
    const id = line.approver_user_id || line.approver_id;
    // user_id는 보통 영문/숫자이므로, 한글(직책명 등)이 포함된 경우에만 과거 양식의 오류로 판별
    return !id || /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(id) || id === 'CEO' || id === 'CTO';
  });
});

const canComplete = computed(() => {
  return formData.value.title.trim() && 
         (isPaymentRequest.value || formData.value.content.trim()) && 
         approvalLines.value.length > 0 &&
         !hasInvalidApprovers.value &&
         (!isPaymentRequest.value || hasValidPaymentRequest.value);
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
  const file = selectedFiles.value[index];
  if (file.id) {
    deletedFileIds.value.push(file.id);
  }
  selectedFiles.value.splice(index, 1);
};

const getFileIcon = (fileName) => {
  if (!fileName) return File;
  const extension = fileName.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return FileText;
  }
  return File;
};

const formatFileSize = (bytes) => {
  return approvalUtils.formatFileSize(bytes);
};

const formatAmountInput = (value) => {
  if (value === null || value === undefined || value === '') return '';
  return Number(value).toLocaleString('ko-KR');
};

const parseAmountInput = (value) => {
  const digits = String(value).replace(/[^0-9]/g, '');
  return digits ? Number(digits) : '';
};

const updateAmountInput = (event, updateValue) => {
  const input = event.target;
  const digitPosition = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/[^0-9]/g, '').length;
  const amount = parseAmountInput(input.value);
  updateValue(amount);

  nextTick(() => {
    const formatted = formatAmountInput(amount);
    let digitsSeen = 0;
    let caretPosition = formatted.length;
    for (let index = 0; index < formatted.length; index += 1) {
      if (/\d/.test(formatted[index])) digitsSeen += 1;
      if (digitsSeen === digitPosition) {
        caretPosition = index + 1;
        break;
      }
    }
    input.value = formatted;
    input.setSelectionRange(caretPosition, caretPosition);
  });
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

// 결재 상신/수정
const submitApproval = async () => {
  if (!canComplete.value) {
    toast.error('필수 정보를 모두 입력해주세요.');
    return;
  }
  
  loading.value = true;
  try {
    const requestData = {
      ...formData.value,
      form_data: isPaymentRequest.value ? {
        workflow_type: 'PAYMENT_REQUEST',
        payment_request: {
          ...paymentRequest.value,
          amount: paymentRequest.value.amount === null || paymentRequest.value.amount === ''
            ? null
            : Number(paymentRequest.value.amount),
          description: formData.value.content.trim(),
        },
      } : (formData.value.form_data || {}),
      approval_lines: approvalLines.value.map(line => ({
        step_order: line.step_order,
        approver_user_id: line.approver_user_id || line.approver_id,
        is_required: line.is_required !== false,
        is_parallel: line.is_parallel === true
      })),
    };
    
    // 새로 추가된 파일만 필터링 (File 객체인 경우)
    const newFiles = selectedFiles.value.filter(file => !file.id);
    
    let result;
    if (props.editRequestId) {
      result = await approvalStore.updateApprovalRequest(props.editRequestId, requestData, newFiles, deletedFileIds.value);
      toast.success('결재가 수정되었습니다.');
    } else {
      result = await approvalStore.createApprovalRequest(requestData, newFiles);
      toast.success('결재가 상신되었습니다.');
    }
    
    emit('created', result);
  } catch (error) {
    toast.error('처리 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const submitPaymentRequest = async () => {
  if (!hasValidPaymentRequest.value) {
    toast.error('납부 담당자를 선택해주세요.');
    return;
  }

  loading.value = true;
  try {
    const task = await paymentTaskApi.createTask({
      ...paymentRequest.value,
      amount: paymentRequest.value.amount === null || paymentRequest.value.amount === ''
        ? null
        : Number(paymentRequest.value.amount),
      description: formData.value.content.trim(),
      files: selectedFiles.value.filter(file => !file.id),
    });
    toast.success('납부 담당자에게 요청을 전달했습니다.');
    emit('created', task);
  } catch (error) {
    toast.error('처리 중 오류가 발생했습니다: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 기존 데이터 로드 (수정 모드)
const loadExistingRequest = async () => {
  if (!props.editRequestId) return;
  
  loading.value = true;
  try {
    const detail = await approvalStore.fetchApprovalDetail(props.editRequestId);
    const lines = await approvalStore.fetchApprovalLines(props.editRequestId);
    const files = await fileApi.getFiles(props.editRequestId);
    
    formData.value = {
      title: detail.title,
      content: detail.content,
      template_id: detail.template_id,
      form_data: detail.form_data || {},
    };

    if (detail.form_data?.workflow_type === 'PAYMENT_REQUEST') {
      isPaymentRequest.value = true;
      paymentRequest.value = {
        name: detail.form_data.payment_request?.name || '',
        category: detail.form_data.payment_request?.category || '',
        amount: detail.form_data.payment_request?.amount ?? null,
        due_date: detail.form_data.payment_request?.due_date || '',
        assignee_id: detail.form_data.payment_request?.assignee_id || '',
      };
    }
    
    approvalLines.value = lines.map(line => ({
      ...line,
      approver_user_id: line.approver_id // 모달과 호환성을 위해 추가
    }));
    
    selectedFiles.value = files.map(f => ({
      id: f.id,
      name: f.file_name,
      size: f.file_size
    }));
    
    if (detail.template_id) {
      const template = templates.value.find(t => t.id === detail.template_id);
      if (template) {
        selectedTemplate.value = template; // 사용자 클릭이 아니므로 오직 화면 선택만 갱신
      }
    }
    
    deletedFileIds.value = [];
  } catch (err) {
    toast.error('기존 데이터를 불러오는데 실패했습니다.');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 초기 로드
onMounted(async () => {
  resetForm();
  await Promise.all([loadTemplates(), userStore.fetchAllUsers()]);
  if (props.editRequestId) {
    await loadExistingRequest();
  }
});

watch(paymentRequest, syncPaymentTitle, { deep: true });
watch(() => paymentRequest.value.assignee_id, assigneeId => {
  if (assigneeId) localStorage.setItem(PAYMENT_ASSIGNEE_STORAGE_KEY, assigneeId);
});
</script>
