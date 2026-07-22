<template>
  <tr v-if="selectedCompany" class="border-b border-gray-200 bg-gray-50">
    <td class="w-[2%] px-4 py-2 text-left"></td>
    <td class="w-[8%] px-4 py-2 align-top">
      <Flatpickr
        class="h-9 w-full rounded-md border border-gray-300 px-2 text-sm"
        v-model="date"
        :config="config"
        placeholder="날짜"
      />
    </td>
    <td class="w-[60%] px-4 py-2 align-top text-left">
      <input
        class="h-9 w-full rounded-md border border-gray-300 px-3 text-sm"
        type="text"
        placeholder="설명을 입력하세요"
        v-model="description"
        @keydown.enter.prevent="saveFile"
      />
    </td>
    <td class="w-[25%] px-4 py-2 align-top text-left">
      <div class="flex gap-2">
        <div class="min-w-0 flex-1">
          <button
            type="button"
            :class="[
              'flex h-9 w-full cursor-pointer items-center justify-center rounded-md border border-dashed px-3 text-center text-sm transition-colors',
              isDragging
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:bg-blue-50',
            ]"
            title="PDF, 이미지, 엑셀, 한글 파일을 드래그하거나 클릭해서 선택"
            @click="openFilePicker"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
          >
            <span class="min-w-0 truncate font-medium">
              {{ files.length ? `${files.length}개 파일 선택됨` : '파일 드래그 또는 클릭' }}
            </span>
          </button>

          <input
            ref="fileInput"
            class="hidden"
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.hwp,.hwpx"
            @change="handleFileChange"
          />

          <div
            v-if="files.length"
            class="mt-1 max-h-14 overflow-y-auto rounded-md border border-gray-200 bg-white"
          >
            <div
              v-for="(file, index) in files"
              :key="`${file.name}-${file.size}-${index}`"
              class="flex h-7 items-center justify-between gap-2 border-b border-gray-100 px-2 text-xs last:border-b-0"
            >
              <span class="min-w-0 truncate" :title="file.name">{{ file.name }}</span>
              <button
                type="button"
                class="shrink-0 rounded px-1.5 py-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="파일 제거"
                @click="removeFile(index)"
              >
                삭제
              </button>
            </div>
          </div>
        </div>

        <input id="lock" v-show="false" type="checkbox" v-model="isLocked" />
        <label
          v-show="roles.includes('ADMIN')"
          for="lock"
          class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-100"
          title="잠금"
        >
          <svg
            v-if="isLocked"
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 text-gray-800"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-3 0H9V9a3 3 0 1 1 6 0v2z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </label>
      </div>
    </td>
    <td class="w-[5%] px-4 py-2 align-top">
      <button
        type="button"
        @click="saveFile"
        :disabled="!canUpload"
        class="h-9 w-14 rounded-md border border-gray-300 bg-white px-2 text-sm transition-colors enabled:cursor-pointer enabled:hover:bg-black enabled:hover:text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        {{ isUploading ? '중...' : '입력' }}
      </button>
    </td>
  </tr>
</template>

<script setup>
import { computed, ref } from 'vue';
import Flatpickr from 'vue-flatpickr-component';
import { authFetch } from '../../utils/authFetch';
import { useToast } from 'vue-toastification';
import { useTypeStore } from '@/stores/useTypeStore';
import { getRoleFromLocalStorage } from '@/utils/token';

const roles = ref(getRoleFromLocalStorage());

const typeStroe = useTypeStore();

const fileApiUrl = `${import.meta.env.VITE_FILE_API_URL}`;

const props = defineProps({
  selectedCompany: String,
  selectedGroupId: String,
});
const ACCEPTED_EXTENSIONS = new Set([
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'xls',
  'xlsx',
  'hwp',
  'hwpx',
]);

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

const date = ref(getTodayDateValue());
const config = {
  dateFormat: 'Ymd',
};
const description = ref('');
const files = ref([]);
const fileInput = ref(null);
const emit = defineEmits(['createFiles']);
const toast = useToast();
const isLocked = ref(false);
const isDragging = ref(false);
const isUploading = ref(false);
const canUpload = computed(() => files.value.length > 0 && !isUploading.value);

function handleFileChange(e) {
  addFiles(e.target.files);
}

function handleFileDrop(e) {
  isDragging.value = false;
  addFiles(e.dataTransfer.files);
}

function openFilePicker() {
  fileInput.value?.click();
}

function addFiles(fileList) {
  const incomingFiles = Array.from(fileList || []);
  const validFiles = incomingFiles.filter((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.has(extension);
  });

  if (validFiles.length !== incomingFiles.length) {
    toast.warning('PDF, 이미지, 엑셀(XLS, XLSX), 한글(HWP, HWPX) 파일만 업로드할 수 있습니다.');
  }

  files.value = [...files.value, ...validFiles];
}

function removeFile(index) {
  files.value = files.value.filter((_, fileIndex) => fileIndex !== index);
  if (fileInput.value) fileInput.value.value = '';
}

function createUploadFormData() {
  const formData = new FormData();
  formData.append('type', typeStroe.currentType);
  formData.append('company', props.selectedCompany);
  formData.append('withdrawn_at', date.value);
  formData.append('name', description.value);
  formData.append('lock', isLocked.value);
  formData.append('group_id', props.selectedGroupId);

  for (const file of files.value) {
    formData.append('file_datas', file);
  }

  return formData;
}

async function saveFile() {
  if (!canUpload.value) return;

  isUploading.value = true;
  try {
    const response = await authFetch(fileApiUrl, {
      method: 'POST',
      body: createUploadFormData(),
    });
    const result = await response.json();

    if (response.ok) {
      toast.success('파일 업로드 성공');
      emit('createFiles', result);
      description.value = '';
      files.value = [];
      date.value = getTodayDateValue();
      if (fileInput.value) fileInput.value.value = '';
      return;
    }

    toast.error('파일 업로드 실패');
  } catch (error) {
    toast.error('파일 업로드 실패');
    console.error(error);
  } finally {
    isUploading.value = false;
  }
}
</script>

<style lang="scss" scoped></style>
