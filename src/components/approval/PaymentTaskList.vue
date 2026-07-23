<template>
  <section>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">납부 업무</h2>
        <p class="mt-1 text-gray-600">내가 요청했거나 담당 중인 납부 업무를 확인하고 처리합니다.</p>
      </div>
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        :disabled="loading"
        @click="loadTasks"
      >
        새로고침
      </button>
    </div>

    <div class="mb-5 border-b border-gray-200">
      <div class="flex gap-5" role="tablist" aria-label="납부 업무 구분">
        <button
          v-for="scope in taskScopes"
          :key="scope.id"
          type="button"
          role="tab"
          :aria-selected="selectedScope === scope.id"
          class="border-b-2 px-1 pb-3 text-sm font-medium transition-colors"
          :class="selectedScope === scope.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'"
          @click="selectedScope = scope.id"
        >
          {{ scope.label }} <span class="ml-1 text-xs">{{ scope.count }}건</span>
        </button>
      </div>
    </div>

    <div class="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <button v-for="filter in filters" :key="filter.id" type="button" class="rounded-lg border p-4 text-left transition-colors" :class="selectedFilter === filter.id ? filter.activeClass : 'border-gray-200 bg-white hover:bg-gray-50'" @click="selectedFilter = filter.id">
        <p class="text-sm" :class="selectedFilter === filter.id ? '' : 'text-gray-600'">{{ filter.label }}</p>
        <p class="mt-1 text-2xl font-bold">{{ filter.count }}건</p>
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500">납부 업무를 불러오는 중입니다.</div>
    <div v-else-if="filteredTasks.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
      조건에 맞는 납부 업무가 없습니다.
    </div>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article v-for="task in filteredTasks" :key="task.id" class="flex min-w-0 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div class="min-w-0">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(task)">
              {{ statusLabel(task) }}
            </span>
            <span v-if="task.category" class="text-sm text-gray-500">{{ task.category }}</span>
          </div>
          <h3 class="truncate text-lg font-semibold text-gray-900" :title="task.title">{{ task.title }}</h3>
          <p class="mt-1 min-h-10 text-sm leading-5 text-gray-600 line-clamp-2">{{ task.description || '등록된 요청 사유가 없습니다.' }}</p>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div class="col-span-2 rounded-md bg-gray-50 p-2.5">
            <dt class="text-xs text-gray-500">요청 금액</dt>
            <dd class="mt-1 break-keep font-semibold text-gray-900">{{ formatAmount(task.requested_amount) }}</dd>
          </div>
          <div class="rounded-md bg-gray-50 p-2.5">
            <dt class="text-xs text-gray-500">납부 기한</dt>
            <dd class="mt-1 font-semibold" :class="dueDateClass(task)">{{ formatDate(task.due_date) }}</dd>
          </div>
          <div class="rounded-md bg-gray-50 p-2.5">
            <dt class="text-xs text-gray-500">남은 기간</dt>
            <dd class="mt-1 font-semibold" :class="dueDateClass(task)">{{ dueLabel(task) }}</dd>
          </div>
        </dl>

        <div v-if="task.status === 'COMPLETED'" class="mt-4 border-t pt-3 text-sm text-gray-600">
          {{ formatDate(task.paid_at) }} 납부 · {{ formatAmount(task.paid_amount) }} · 증빙 {{ task.receipt_file_ids.length }}개
        </div>
        <div v-if="task.request_file_ids?.length" class="mt-4 border-t pt-3">
          <button type="button" class="text-sm font-medium text-blue-700 hover:text-blue-900" @click="toggleRequestFiles(task)">
            요청 첨부파일 {{ task.request_file_ids.length }}개 {{ taskFiles[task.id] ? '접기' : '펼치기' }}
          </button>
          <div v-if="taskFiles[task.id]" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="file in taskFiles[task.id]"
              :key="file.id"
              type="button"
              class="rounded border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
              @click="downloadRequestFile(task, file)"
            >
              {{ file.file_name }}
            </button>
          </div>
        </div>
        <div v-if="canEditTask(task) || canManageCompletedFiles(task) || (canProcessTask(task) && task.status !== 'COMPLETED')" class="mt-auto flex flex-wrap justify-end gap-2 pt-4">
          <button
            v-if="canEditTask(task)"
            type="button"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="openEditModal(task)"
          >
            요청 수정
          </button>
          <button
            v-if="canManageCompletedFiles(task)"
            type="button"
            class="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
            @click="openEditModal(task, true)"
          >
            납부 내역 수정
          </button>
          <button
            v-if="canProcessTask(task) && !task.is_request_confirmed"
            type="button"
            class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            @click="confirmTask(task)"
          >
            요청 확인
          </button>
          <button
            v-else-if="canProcessTask(task) && task.status === 'PENDING_SETUP'"
            type="button"
            class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            @click="openDueDateModal(task)"
          >
            기한 설정
          </button>
          <button
            v-else-if="canProcessTask(task) && task.status !== 'COMPLETED'"
            type="button"
            class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="openCompleteModal(task)"
          >
            납부 완료 처리
          </button>
        </div>
      </article>
    </div>

    <div v-if="selectedTask" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @mousedown.self="closeModal">
      <form class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" @submit.prevent="completeTask">
        <h3 class="text-lg font-semibold text-gray-900">납부 완료 처리</h3>
        <p class="mt-1 text-sm text-gray-500">{{ selectedTask.title }}</p>
        <div class="mt-5 space-y-4">
          <label class="block text-sm font-medium text-gray-700">실제 납부일
            <input v-model="completionForm.paidAt" required type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label class="block text-sm font-medium text-gray-700">실제 납부 금액 <span class="text-gray-400">(선택)</span>
            <input :value="formatAmountInput(completionForm.paidAmount)" inputmode="numeric" type="text" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="금액을 입력하세요" @input="updateAmountInput($event, value => (completionForm.paidAmount = value))" />
          </label>
          <div>
            <p class="text-sm font-medium text-gray-700">납부확인증 <span class="text-gray-400">(선택)</span></p>
            <div
              class="mt-1 rounded-lg border-2 border-dashed p-6 text-center transition-colors"
              :class="isReceiptDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'"
              @dragenter.prevent="isReceiptDragOver = true"
              @dragover.prevent="isReceiptDragOver = true"
              @dragleave.prevent="isReceiptDragOver = false"
              @drop.prevent="handleReceiptDrop"
            >
              <input ref="receiptFileInput" multiple type="file" class="hidden" @change="handleReceiptFiles" />
              <Upload class="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p class="mb-2 text-gray-500">증빙파일을 드래그하거나 클릭하여 업로드</p>
              <button type="button" class="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200" @click="receiptFileInput?.click()">
                파일 선택
              </button>
            </div>
            <div v-if="completionForm.receiptFiles.length" class="mt-4 space-y-2">
              <h5 class="font-medium text-gray-900">선택된 파일</h5>
              <div class="max-h-44 space-y-2 overflow-y-auto pr-1">
                <div v-for="(file, index) in completionForm.receiptFiles" :key="`${file.name}-${file.lastModified}`" class="flex items-center justify-between rounded-md bg-gray-50 p-3">
                  <div class="flex min-w-0 items-center space-x-3">
                    <component :is="getFileIcon(file.name)" class="h-5 w-5 shrink-0 text-gray-400" />
                    <div class="min-w-0">
                      <p class="truncate font-medium text-gray-900">{{ file.name }}</p>
                      <p class="text-sm text-gray-500">{{ formatFileSize(file.size) }}</p>
                    </div>
                  </div>
                  <button type="button" class="p-1 text-red-500 hover:text-red-700" :aria-label="`${file.name} 삭제`" @click="removeReceiptFile(index)">
                    <X class="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <label class="block text-sm font-medium text-gray-700">메모
            <textarea v-model="completionForm.note" rows="3" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="거래번호나 참고사항을 입력하세요." />
          </label>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200" @click="closeModal">취소</button>
          <button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50" :disabled="completing">
            {{ completing ? '처리 중...' : '완료 등록' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="dueDateTask" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @mousedown.self="closeDueDateModal">
      <form class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" @submit.prevent="setDueDate">
        <h3 class="text-lg font-semibold text-gray-900">납부 기한 설정</h3>
        <p class="mt-1 text-sm text-gray-500">{{ dueDateTask.title }}</p>
        <label class="mt-5 block text-sm font-medium text-gray-700">실제 납부 기한
          <input v-model="dueDateInput" required type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
        </label>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200" @click="closeDueDateModal">취소</button>
          <button type="submit" class="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50" :disabled="settingDueDate">
            {{ settingDueDate ? '저장 중...' : '기한 저장' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="editingTask" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @mousedown.self="closeEditModal">
      <form class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" @submit.prevent="updateTask">
        <h3 class="text-lg font-semibold text-gray-900">{{ editingFilesOnly ? '납부 내역 수정' : '납부 요청 수정' }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ editingFilesOnly ? '실제 납부일, 금액, 메모와 증빙파일을 보완할 수 있습니다.' : '납부 담당자가 요청을 확인하기 전까지 수정할 수 있습니다.' }}</p>
        <div v-if="editingFilesOnly" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">실제 납부일<input v-model="editForm.paidAt" required type="date" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700">실제 납부 금액 <span class="text-gray-400">(선택)</span><input :value="formatAmountInput(editForm.paidAmount)" inputmode="numeric" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" placeholder="금액을 입력하세요" @input="updateAmountInput($event, value => (editForm.paidAmount = value))" /></label>
          <label class="text-sm font-medium text-gray-700 sm:col-span-2">메모<textarea v-model="editForm.completionNote" rows="3" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" placeholder="거래번호나 참고사항을 입력하세요." /></label>
        </div>
        <div v-if="!editingFilesOnly" class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">업무명<input v-model="editForm.name" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700">분류<input v-model="editForm.category" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700">요청 금액<input :value="formatAmountInput(editForm.amount)" inputmode="numeric" type="text" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" placeholder="금액을 입력하세요" @input="updateAmountInput($event, value => (editForm.amount = value))" /></label>
          <label class="text-sm font-medium text-gray-700">납부 기한<input v-model="editForm.dueDate" type="date" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700 sm:col-span-2">요청 사유<textarea v-model="editForm.description" rows="3" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
        </div>
        <div class="mt-5">
          <p class="text-sm font-medium text-gray-700">{{ editingFilesOnly ? '기존 납부 증빙' : '기존 첨부파일' }}</p>
          <div v-if="editFiles.length" class="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
            <div v-for="file in editFiles" :key="file.id" class="flex items-center justify-between rounded-md bg-gray-50 p-3">
              <div class="flex min-w-0 items-center space-x-3">
                <component :is="getFileIcon(file.file_name)" class="h-5 w-5 shrink-0 text-gray-400" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-900">{{ file.file_name }}</p>
                  <p class="text-sm text-gray-500">{{ formatFileSize(file.file_size) }}</p>
                </div>
              </div>
              <button type="button" class="p-1 text-red-500 hover:text-red-700" :aria-label="`${file.file_name} 삭제`" @click="removeEditFile(file.id)">
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
          <p v-else class="mt-2 text-sm text-gray-500">{{ editingFilesOnly ? '등록된 납부 증빙이 없습니다.' : '첨부파일이 없습니다.' }}</p>
        </div>
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700">{{ editingFilesOnly ? '추가 납부 증빙' : '추가 첨부파일' }}</p>
          <div class="mt-1 rounded-lg border-2 border-dashed p-6 text-center transition-colors" :class="isEditDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'" @dragenter.prevent="isEditDragOver = true" @dragover.prevent="isEditDragOver = true" @dragleave.prevent="isEditDragOver = false" @drop.prevent="handleEditDrop">
            <input ref="editFileInput" multiple type="file" class="hidden" @change="handleEditFiles" />
            <Upload class="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p class="mb-2 text-gray-500">{{ editingFilesOnly ? '증빙파일을 드래그하거나 클릭하여 업로드' : '파일을 드래그하거나 클릭하여 업로드' }}</p>
            <button type="button" class="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200" @click="editFileInput?.click()">
              파일 선택
            </button>
          </div>
          <div v-if="editForm.newFiles.length" class="mt-4 space-y-2">
            <h5 class="font-medium text-gray-900">선택된 파일</h5>
            <div class="max-h-44 space-y-2 overflow-y-auto pr-1">
              <div v-for="(file, index) in editForm.newFiles" :key="`${file.name}-${file.lastModified}`" class="flex items-center justify-between rounded-md bg-gray-50 p-3">
                <div class="flex min-w-0 items-center space-x-3">
                  <component :is="getFileIcon(file.name)" class="h-5 w-5 shrink-0 text-gray-400" />
                  <div class="min-w-0">
                    <p class="truncate font-medium text-gray-900">{{ file.name }}</p>
                    <p class="text-sm text-gray-500">{{ formatFileSize(file.size) }}</p>
                  </div>
                </div>
                <button type="button" class="p-1 text-red-500 hover:text-red-700" :aria-label="`${file.name} 삭제`" @click="removeNewEditFile(index)">
                  <X class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700" @click="closeEditModal">취소</button><button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="updating">{{ updating ? '저장 중...' : editingFilesOnly ? '납부 내역 저장' : '수정 저장' }}</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { File, FileText, Upload, X } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import { paymentTaskApi } from '@/utils/approvalApi';
import { useUserStore } from '@/stores/useUserStore';

const emit = defineEmits(['summary-changed']);
const toast = useToast();
const userStore = useUserStore();
const tasks = ref([]);
const loading = ref(false);
const completing = ref(false);
const settingDueDate = ref(false);
const selectedTask = ref(null);
const dueDateTask = ref(null);
const dueDateInput = ref('');
const completionForm = ref({ paidAt: '', paidAmount: 0, note: '', receiptFiles: [] });
const isReceiptDragOver = ref(false);
const receiptFileInput = ref(null);
const isEditDragOver = ref(false);
const editFileInput = ref(null);
const taskFiles = ref({});
const selectedScope = ref('ASSIGNED');
const selectedFilter = ref('ALL');
const editingTask = ref(null);
const editingFilesOnly = ref(false);
const updating = ref(false);
const editFiles = ref([]);
const editForm = ref({ name: '', category: '', amount: '', dueDate: '', description: '', paidAt: '', paidAmount: '', completionNote: '', newFiles: [], deletedFileIds: [] });

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const currentUserId = computed(() => userStore.currentUser?.user_id || userStore.currentUser?.id);
const dateDiff = dueDate => dueDate
  ? Math.ceil((new Date(`${dueDate}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000)
  : null;
const isOpenTask = task => task.status !== 'COMPLETED';
const scopedTasks = computed(() => tasks.value.filter(task => selectedScope.value === 'ASSIGNED'
  ? task.assignee_id === currentUserId.value
  : task.requester_id === currentUserId.value));
const taskScopes = computed(() => [
  { id: 'ASSIGNED', label: '요청 받은 업무', count: tasks.value.filter(task => task.assignee_id === currentUserId.value).length },
  { id: 'REQUESTED', label: '내가 요청한 업무', count: tasks.value.filter(task => task.requester_id === currentUserId.value).length },
]);
const todayTasks = computed(() => scopedTasks.value.filter(task => isOpenTask(task) && dateDiff(task.due_date) === 0));
const soonTasks = computed(() => scopedTasks.value.filter(task => isOpenTask(task) && dateDiff(task.due_date) >= 1 && dateDiff(task.due_date) <= 3));
const completedTasks = computed(() => scopedTasks.value.filter(task => task.status === 'COMPLETED'));
const filters = computed(() => [
  { id: 'SOON', label: '3일 이내 마감', count: soonTasks.value.length, activeClass: 'border-amber-300 bg-amber-50 text-amber-800' },
  { id: 'TODAY', label: '당일 마감', count: todayTasks.value.length, activeClass: 'border-blue-300 bg-blue-50 text-blue-800' },
  { id: 'COMPLETED', label: '납부 완료', count: completedTasks.value.length, activeClass: 'border-green-300 bg-green-50 text-green-800' },
  { id: 'ALL', label: '전체 업무', count: scopedTasks.value.length, activeClass: 'border-gray-400 bg-gray-100 text-gray-900' },
]);
const filteredTasks = computed(() => {
  if (selectedFilter.value === 'TODAY') return todayTasks.value;
  if (selectedFilter.value === 'SOON') return soonTasks.value;
  if (selectedFilter.value === 'COMPLETED') return completedTasks.value;
  return scopedTasks.value;
});

const loadTasks = async () => {
  loading.value = true;
  try {
    const loadedTasks = await paymentTaskApi.getMyTasks();
    tasks.value = [...loadedTasks].sort((left, right) => Number(left.status === 'COMPLETED') - Number(right.status === 'COMPLETED'));
  } catch (error) {
    toast.error(error.message || '납부 업무를 불러오지 못했습니다.');
  } finally {
    loading.value = false;
  }
};

const refreshSummary = async () => {
  try {
    emit('summary-changed', await paymentTaskApi.getSummary());
  } catch (error) {
    // 목록 조회와 무관한 보조 정보이므로 실패해도 화면을 막지 않는다.
  }
};

const formatAmount = value => value === null || value === undefined ? '-' : `${Number(value).toLocaleString('ko-KR')}원`;
const formatAmountInput = value => value === null || value === undefined || value === '' ? '' : Number(value).toLocaleString('ko-KR');
const parseAmountInput = value => {
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
const formatDate = value => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) : '-';
const statusLabel = task => ({ COMPLETED: '납부 완료', PENDING_PAYMENT: '납부 대기', PENDING_SETUP: '기한 설정 필요' })[task.status] || '납부 대기';
const statusClass = task => task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : task.status === 'PENDING_SETUP' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700';
const dueDateClass = task => dateDiff(task.due_date) !== null && dateDiff(task.due_date) >= 0 && dateDiff(task.due_date) <= 3 && task.status !== 'COMPLETED' ? 'text-amber-700' : 'text-gray-900';
const dueLabel = task => {
  if (task.status === 'COMPLETED') return '완료';
  if (!task.due_date) return '미설정';
  const diff = dateDiff(task.due_date);
  return diff < 0 ? '-' : diff === 0 ? 'D-day' : `D-${diff}`;
};
const canProcessTask = task => task.assignee_id === currentUserId.value;
const canEditTask = task => task.requester_id === currentUserId.value && !task.is_request_confirmed && task.status !== 'COMPLETED';
const canManageCompletedFiles = task => canProcessTask(task) && task.status === 'COMPLETED';

const openCompleteModal = task => {
  selectedTask.value = task;
  completionForm.value = { paidAt: today(), paidAmount: task.requested_amount, note: '', receiptFiles: [] };
};
const closeModal = () => { selectedTask.value = null; };
const openDueDateModal = task => {
  dueDateTask.value = task;
  dueDateInput.value = task.due_date || today();
};
const closeDueDateModal = () => { dueDateTask.value = null; };
const openEditModal = async (task, filesOnly = false) => {
  editingTask.value = task;
  editingFilesOnly.value = filesOnly;
  editForm.value = {
    name: task.request_name || '',
    category: task.category || '',
    amount: task.requested_amount ?? '',
    dueDate: task.due_date || '',
    description: task.description || '',
    paidAt: task.paid_at || '',
    paidAmount: task.paid_amount ?? '',
    completionNote: task.completion_note || '',
    newFiles: [],
    deletedFileIds: [],
  };
  try {
    const files = await paymentTaskApi.getTaskFiles(task.id);
    editFiles.value = filesOnly ? files.filter(file => task.receipt_file_ids?.includes(file.id)) : files;
  } catch (error) {
    editFiles.value = [];
    toast.error('기존 첨부파일을 불러오지 못했습니다.');
  }
};
const closeEditModal = () => {
  editingTask.value = null;
  editingFilesOnly.value = false;
};
const addEditFiles = files => {
  const maxSize = 20 * 1024 * 1024;
  const existingNames = new Set(editForm.value.newFiles.map(file => file.name));
  const filesToAdd = files.filter(file => {
    if (file.size > maxSize) {
      toast.error(`${file.name}은(는) 20MB를 초과합니다.`);
      return false;
    }
    if (existingNames.has(file.name)) {
      toast.error(`${file.name}은(는) 이미 추가되었습니다.`);
      return false;
    }
    return true;
  });
  editForm.value.newFiles = [...editForm.value.newFiles, ...filesToAdd];
};
const handleEditFiles = event => {
  addEditFiles(Array.from(event.target.files || []));
  event.target.value = '';
};
const handleEditDrop = event => {
  isEditDragOver.value = false;
  addEditFiles(Array.from(event.dataTransfer.files || []));
};
const removeNewEditFile = index => { editForm.value.newFiles.splice(index, 1); };
const formatFileSize = size => {
  if (size === undefined || size === null) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};
const getFileIcon = fileName => {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension) ? FileText : File;
};
const removeEditFile = fileId => {
  editForm.value.deletedFileIds.push(fileId);
  editFiles.value = editFiles.value.filter(file => file.id !== fileId);
};
const updateTask = async () => {
  updating.value = true;
  try {
    const taskUpdate = {
      files: editForm.value.newFiles,
      deletedFileIds: editForm.value.deletedFileIds,
    };
    if (!editingFilesOnly.value) {
      Object.assign(taskUpdate, {
        name: editForm.value.name,
        category: editForm.value.category,
        amount: editForm.value.amount === '' ? undefined : Number(editForm.value.amount),
        due_date: editForm.value.dueDate,
        description: editForm.value.description,
      });
    }
    if (editingFilesOnly.value) {
      await paymentTaskApi.updateCompletion(editingTask.value.id, {
        paidAt: editForm.value.paidAt,
        paidAmount: editForm.value.paidAmount,
        note: editForm.value.completionNote,
        receiptFiles: taskUpdate.files,
        deletedFileIds: taskUpdate.deletedFileIds,
      });
    } else {
      await paymentTaskApi.updateTask(editingTask.value.id, taskUpdate);
    }
    toast.success(editingFilesOnly.value ? '납부 내역을 수정했습니다.' : '납부 요청을 수정했습니다.');
    closeEditModal();
    await loadTasks();
  } catch (error) {
    toast.error(error.message || '납부 요청 수정에 실패했습니다.');
  } finally {
    updating.value = false;
  }
};
const confirmTask = async task => {
  if (!confirm('요청 내용을 확인하면 요청자는 더 이상 수정할 수 없습니다. 계속하시겠습니까?')) return;
  try {
    await paymentTaskApi.confirmTask(task.id);
    toast.success('요청을 확인했습니다.');
    await loadTasks();
    await refreshSummary();
  } catch (error) {
    toast.error(error.message || '요청 확인에 실패했습니다.');
  }
};
const toggleRequestFiles = async task => {
  if (taskFiles.value[task.id]) {
    const nextFiles = { ...taskFiles.value };
    delete nextFiles[task.id];
    taskFiles.value = nextFiles;
    return;
  }
  try {
    taskFiles.value = { ...taskFiles.value, [task.id]: await paymentTaskApi.getTaskFiles(task.id) };
  } catch (error) {
    toast.error(error.message || '요청 첨부파일을 불러오지 못했습니다.');
  }
};
const downloadRequestFile = async (task, file) => {
  if (!file.id) {
    toast.error('첨부파일 정보를 찾을 수 없습니다.');
    return;
  }
  try {
    await paymentTaskApi.downloadTaskFile(task.id, file.id, file.file_name);
  } catch (error) {
    toast.error(error.message || '첨부파일 다운로드에 실패했습니다.');
  }
};
const addReceiptFiles = files => {
  const maxSize = 20 * 1024 * 1024;
  const existingNames = new Set(completionForm.value.receiptFiles.map(file => file.name));
  const filesToAdd = files.filter(file => {
    if (file.size > maxSize) {
      toast.error(`${file.name}은(는) 20MB를 초과합니다.`);
      return false;
    }
    if (existingNames.has(file.name)) {
      toast.error(`${file.name}은(는) 이미 추가되었습니다.`);
      return false;
    }
    return true;
  });
  completionForm.value.receiptFiles = [...completionForm.value.receiptFiles, ...filesToAdd];
};
const handleReceiptFiles = event => {
  addReceiptFiles(Array.from(event.target.files || []));
  event.target.value = '';
};
const handleReceiptDrop = event => {
  isReceiptDragOver.value = false;
  addReceiptFiles(Array.from(event.dataTransfer.files || []));
};
const removeReceiptFile = index => { completionForm.value.receiptFiles.splice(index, 1); };
const completeTask = async () => {
  completing.value = true;
  try {
    await paymentTaskApi.completeTask(selectedTask.value.id, completionForm.value);
    toast.success(completionForm.value.receiptFiles.length ? '납부 완료와 증빙이 등록되었습니다.' : '납부 완료 처리되었습니다.');
    closeModal();
    await loadTasks();
    await refreshSummary();
  } catch (error) {
    toast.error(error.message || '납부 완료 처리에 실패했습니다.');
  } finally {
    completing.value = false;
  }
};

const setDueDate = async () => {
  settingDueDate.value = true;
  try {
    await paymentTaskApi.setDueDate(dueDateTask.value.id, dueDateInput.value);
    toast.success('납부 기한을 설정했습니다.');
    closeDueDateModal();
    await loadTasks();
    await refreshSummary();
  } catch (error) {
    toast.error(error.message || '납부 기한 설정에 실패했습니다.');
  } finally {
    settingDueDate.value = false;
  }
};

onMounted(async () => {
  if (!userStore.currentUser) await userStore.fetchCurrentUser();
  await loadTasks();
  await refreshSummary();
});
</script>
