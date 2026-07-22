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

    <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button v-for="filter in filters" :key="filter.id" type="button" class="rounded-lg border p-4 text-left transition-colors" :class="selectedFilter === filter.id ? filter.activeClass : 'border-gray-200 bg-white hover:bg-gray-50'" @click="selectedFilter = filter.id">
        <p class="text-sm" :class="selectedFilter === filter.id ? '' : 'text-gray-600'">{{ filter.label }}</p>
        <p class="mt-1 text-2xl font-bold">{{ filter.count }}건</p>
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-gray-500">납부 업무를 불러오는 중입니다.</div>
    <div v-else-if="filteredTasks.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
      조건에 맞는 납부 업무가 없습니다.
    </div>
    <div v-else class="space-y-3">
      <article v-for="task in filteredTasks" :key="task.id" class="rounded-lg border bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="min-w-0">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass(task)">
                {{ statusLabel(task) }}
              </span>
              <span v-if="task.category" class="text-sm text-gray-500">{{ task.category }}</span>
            </div>
            <h3 class="truncate text-lg font-semibold text-gray-900">{{ task.title }}</h3>
            <p class="mt-1 text-sm text-gray-600">{{ task.description || '등록된 요청 사유가 없습니다.' }}</p>
          </div>

          <div class="grid grid-cols-2 gap-x-7 gap-y-2 text-sm sm:grid-cols-3 lg:shrink-0">
            <div><p class="text-gray-500">요청 금액</p><p class="font-semibold">{{ formatAmount(task.requested_amount) }}</p></div>
            <div><p class="text-gray-500">납부 기한</p><p class="font-semibold" :class="dueDateClass(task)">{{ formatDate(task.due_date) }}</p></div>
            <div><p class="text-gray-500">남은 기간</p><p class="font-semibold" :class="dueDateClass(task)">{{ dueLabel(task) }}</p></div>
          </div>

          <button
            v-if="canEditTask(task)"
            type="button"
            class="shrink-0 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="openEditModal(task)"
          >
            요청 수정
          </button>
          <button
            v-if="canProcessTask(task) && !task.is_request_confirmed"
            type="button"
            class="shrink-0 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            @click="confirmTask(task)"
          >
            요청 확인
          </button>
          <button
            v-else-if="canProcessTask(task) && task.status === 'PENDING_SETUP'"
            type="button"
            class="shrink-0 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            @click="openDueDateModal(task)"
          >
            기한 설정
          </button>
          <button
            v-else-if="canProcessTask(task) && task.status !== 'COMPLETED'"
            type="button"
            class="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="openCompleteModal(task)"
          >
            납부 완료 처리
          </button>
        </div>
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
      </article>
    </div>

    <div v-if="selectedTask" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeModal">
      <form class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" @submit.prevent="completeTask">
        <h3 class="text-lg font-semibold text-gray-900">납부 완료 처리</h3>
        <p class="mt-1 text-sm text-gray-500">{{ selectedTask.title }}</p>
        <div class="mt-5 space-y-4">
          <label class="block text-sm font-medium text-gray-700">실제 납부일
            <input v-model="completionForm.paidAt" required type="date" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <label class="block text-sm font-medium text-gray-700">실제 납부 금액
            <input v-model.number="completionForm.paidAmount" required min="0" type="number" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
          </label>
          <div>
            <p class="text-sm font-medium text-gray-700">납부확인증 <span class="text-red-500">*</span></p>
            <div
              class="mt-1 rounded-lg border-2 border-dashed p-5 text-center transition-colors"
              :class="isReceiptDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'"
              @dragenter.prevent="isReceiptDragOver = true"
              @dragover.prevent="isReceiptDragOver = true"
              @dragleave.prevent="isReceiptDragOver = false"
              @drop.prevent="handleReceiptDrop"
            >
              <p class="text-sm text-gray-700">파일을 이곳으로 끌어다 놓거나 아래에서 선택하세요.</p>
              <input required multiple type="file" class="mx-auto mt-3 block max-w-xs text-sm" @change="handleReceiptFiles" />
              <p class="mt-2 text-xs text-gray-500">납부확인증, 이체확인증 등 증빙 파일을 첨부합니다.</p>
            </div>
            <p v-if="completionForm.receiptFiles.length" class="mt-2 text-xs text-gray-600">선택됨: {{ completionForm.receiptFiles.map(file => file.name).join(', ') }}</p>
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

    <div v-if="dueDateTask" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeDueDateModal">
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

    <div v-if="editingTask" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="closeEditModal">
      <form class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl" @submit.prevent="updateTask">
        <h3 class="text-lg font-semibold text-gray-900">납부 요청 수정</h3>
        <p class="mt-1 text-sm text-gray-500">납부 담당자가 요청을 확인하기 전까지 수정할 수 있습니다.</p>
        <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">업무명<input v-model="editForm.name" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700">분류<input v-model="editForm.category" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700">요청 금액<input v-model="editForm.amount" min="0" type="number" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700">납부 기한<input v-model="editForm.dueDate" type="date" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
          <label class="text-sm font-medium text-gray-700 sm:col-span-2">요청 사유<textarea v-model="editForm.description" rows="3" class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" /></label>
        </div>
        <div class="mt-5">
          <p class="text-sm font-medium text-gray-700">기존 첨부파일</p>
          <div v-if="editFiles.length" class="mt-2 space-y-2">
            <div v-for="file in editFiles" :key="file.id" class="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm">
              <span>{{ file.file_name }}</span>
              <button type="button" class="text-red-600 hover:text-red-800" @click="removeEditFile(file.id)">삭제</button>
            </div>
          </div>
          <p v-else class="mt-2 text-sm text-gray-500">첨부파일이 없습니다.</p>
        </div>
        <div class="mt-4">
          <p class="text-sm font-medium text-gray-700">추가 첨부파일</p>
          <div class="mt-1 rounded-lg border-2 border-dashed p-4 text-center" :class="isEditDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'" @dragenter.prevent="isEditDragOver = true" @dragover.prevent="isEditDragOver = true" @dragleave.prevent="isEditDragOver = false" @drop.prevent="handleEditDrop">
            <p class="text-sm text-gray-700">파일을 이곳으로 끌어다 놓거나 선택하세요.</p>
            <input multiple type="file" class="mx-auto mt-2 block max-w-xs text-sm" @change="handleEditFiles" />
          </div>
          <p v-if="editForm.newFiles.length" class="mt-2 text-xs text-gray-600">추가됨: {{ editForm.newFiles.map(file => file.name).join(', ') }}</p>
        </div>
        <div class="mt-6 flex justify-end gap-3"><button type="button" class="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700" @click="closeEditModal">취소</button><button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="updating">{{ updating ? '저장 중...' : '수정 저장' }}</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
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
const isEditDragOver = ref(false);
const taskFiles = ref({});
const selectedFilter = ref('ALL');
const editingTask = ref(null);
const updating = ref(false);
const editFiles = ref([]);
const editForm = ref({ name: '', category: '', amount: '', dueDate: '', description: '', newFiles: [], deletedFileIds: [] });

const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
const dateDiff = dueDate => dueDate
  ? Math.ceil((new Date(`${dueDate}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000)
  : null;
const isOpenTask = task => task.status !== 'COMPLETED';
const todayTasks = computed(() => tasks.value.filter(task => isOpenTask(task) && dateDiff(task.due_date) === 0));
const soonTasks = computed(() => tasks.value.filter(task => isOpenTask(task) && dateDiff(task.due_date) >= 1 && dateDiff(task.due_date) <= 3));
const filters = computed(() => [
  { id: 'SOON', label: '3일 이내 마감', count: soonTasks.value.length, activeClass: 'border-amber-300 bg-amber-50 text-amber-800' },
  { id: 'TODAY', label: '당일 마감', count: todayTasks.value.length, activeClass: 'border-blue-300 bg-blue-50 text-blue-800' },
  { id: 'ALL', label: '전체 업무', count: tasks.value.length, activeClass: 'border-gray-400 bg-gray-100 text-gray-900' },
]);
const filteredTasks = computed(() => selectedFilter.value === 'TODAY'
  ? todayTasks.value
  : selectedFilter.value === 'SOON' ? soonTasks.value : tasks.value);

const loadTasks = async () => {
  loading.value = true;
  try {
    tasks.value = await paymentTaskApi.getMyTasks();
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
const canProcessTask = task => task.assignee_id === (userStore.currentUser?.user_id || userStore.currentUser?.id);
const canEditTask = task => task.requester_id === (userStore.currentUser?.user_id || userStore.currentUser?.id) && !task.is_request_confirmed && task.status !== 'COMPLETED';

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
const openEditModal = async task => {
  editingTask.value = task;
  editForm.value = {
    name: task.request_name || '',
    category: task.category || '',
    amount: task.requested_amount ?? '',
    dueDate: task.due_date || '',
    description: task.description || '',
    newFiles: [],
    deletedFileIds: [],
  };
  try {
    editFiles.value = await paymentTaskApi.getTaskFiles(task.id);
  } catch (error) {
    editFiles.value = [];
    toast.error('기존 첨부파일을 불러오지 못했습니다.');
  }
};
const closeEditModal = () => { editingTask.value = null; };
const handleEditFiles = event => { editForm.value.newFiles = Array.from(event.target.files || []); };
const handleEditDrop = event => {
  isEditDragOver.value = false;
  editForm.value.newFiles = Array.from(event.dataTransfer.files || []);
};
const removeEditFile = fileId => {
  editForm.value.deletedFileIds.push(fileId);
  editFiles.value = editFiles.value.filter(file => file.id !== fileId);
};
const updateTask = async () => {
  updating.value = true;
  try {
    await paymentTaskApi.updateTask(editingTask.value.id, {
      name: editForm.value.name,
      category: editForm.value.category,
      amount: editForm.value.amount === '' ? undefined : Number(editForm.value.amount),
      due_date: editForm.value.dueDate,
      description: editForm.value.description,
      files: editForm.value.newFiles,
      deletedFileIds: editForm.value.deletedFileIds,
    });
    toast.success('납부 요청을 수정했습니다.');
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
const handleReceiptFiles = event => { completionForm.value.receiptFiles = Array.from(event.target.files || []); };
const handleReceiptDrop = event => {
  isReceiptDragOver.value = false;
  completionForm.value.receiptFiles = Array.from(event.dataTransfer.files || []);
};
const completeTask = async () => {
  if (!completionForm.value.receiptFiles.length) {
    toast.warning('납부확인증을 첨부해주세요.');
    return;
  }
  completing.value = true;
  try {
    await paymentTaskApi.completeTask(selectedTask.value.id, completionForm.value);
    toast.success('납부 완료와 증빙이 등록되었습니다.');
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
