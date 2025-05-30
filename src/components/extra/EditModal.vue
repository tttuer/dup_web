<!-- components/EditModal.vue -->
<template>
  <div
    v-if="visible"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @click="handleBackgroundClick"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
  >
    <div class="w-[450px] rounded-lg bg-white p-6 shadow-sm" @click.stop>
      <h2 class="mb-4 text-lg font-semibold">파일 수정</h2>

      <!-- 날짜 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">날짜</label>
        <Flatpickr
          class="w-full rounded-sm border border-gray-300 p-2"
          v-model="form.withdrawn_at"
          :config="config"
          placeholder="날짜를 선택하세요"
        />
      </div>

      <!-- 설명 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">설명</label>
        <input
          v-model="form.name"
          type="text"
          class="mt-1 w-full rounded border border-gray-300 p-2"
        />
      </div>

      <!-- 파일 첨부 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">새 첨부파일 (선택 시 기존 파일 대체)</label>
        <input
          type="file"
          accept="application/pdf"
          class="mt-1 w-full cursor-pointer border pt-1 pb-1"
          @change="handleFileChange"
        />
        <p class="mt-1 text-xs text-gray-500">기존 파일: {{ file?.file_name }}</p>
      </div>
      <div class="flex">
        <p class="mr-2 text-sm font-medium" v-show="roles.includes('ADMIN')">잠금</p>
        <input id="modal-lock" v-show="false" type="checkbox" v-model="form.lock" />
        <label
          v-show="roles.includes('ADMIN')"
          for="modal-lock"
          class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-300 hover:bg-gray-200"
        >
          <svg
            v-if="form.lock"
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
            class="size-3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </label>
      </div>
      <div class="flex justify-end space-x-2">
        <button @click="$emit('close')" class="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400">
          취소
        </button>
        <button @click="save" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          수정
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from 'vue';
import Flatpickr from 'vue-flatpickr-component';
import { useCurrencyFormatter } from '@/utils/currencyFormatter';
import { getRoleFromLocalStorage } from '@/utils/token';

const roles = ref(getRoleFromLocalStorage());
const { formatted, formatCurrency } = useCurrencyFormatter();

const props = defineProps({
  visible: Boolean,
  file: Object,
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: '',
  name: '',
  withdrawn_at: '',
  company: '',
  lock: false,
  group_id: '',
});
const newFile = ref(null);

// flatpickr 옵션
const config = {
  dateFormat: 'Ymd',
};

// 드래그 중 클릭 방지를 위한 상태
let isDragging = false;

watch(
  () => props.visible,
  (val) => {
    if (val && props.file) {
      form.id = props.file.id;
      form.name = props.file.name;
      form.withdrawn_at = props.file.withdrawn_at;
      form.company = props.file.company;
      form.lock = props.file.lock;
      form.group_id = props.file.group_id;

    }
  },
);

function handleFileChange(event) {
  newFile.value = event.target.files[0];
}
function handleMouseDown() {
  isDragging = false;
}

function handleMouseMove() {
  isDragging = true;
}

function handleBackgroundClick(event) {
  // 드래그로 인한 클릭은 무시
  if (isDragging) return;
  // 클릭한 대상이 이 배경 div 본인인 경우에만 닫기
  if (event.target === event.currentTarget) {
    emit('close');
  }
}

function save() {
  const payload = {
    ...form,
    file: newFile.value || null,
  };
  emit('save', payload);
}
</script>
