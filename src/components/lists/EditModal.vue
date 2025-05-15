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

      <!-- 파일 첨부 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">새 첨부파일 (선택 시 기존 파일 대체)</label>
        <input
          type="file"
          multiple
          accept="application/pdf"
          class="mt-1 w-full cursor-pointer border pt-1 pb-1"
          @change="handleFileChange"
        />
        <p class="mt-1 text-xs text-gray-500">
          기존 파일:
          <template v-if="voucher?.files?.length">
            <div v-for="(file, i) in voucher.files" :key="i" class="flex items-center space-x-2">
              <input
                type="checkbox"
                :id="`delete-${i}`"
                v-model="deleteTargets"
                :value="file.file_name"
                class="form-checkbox text-red-500"
              />
              <label :for="`delete-${i}`" class="flex items-center space-x-1">
                <span
                  :class="{
                    'text-red-500 line-through': deleteTargets.includes(file.file_name),
                  }"
                >
                  {{ file.file_name }}
                </span>
                <span v-if="deleteTargets.includes(file.file_name)">❌</span>
              </label>
            </div>
          </template>
          <template v-else> 없음 </template>
        </p>
      </div>

      <div class="flex">
        <p class="mr-2 text-sm font-medium" v-show="role === 'ADMIN'">잠금</p>
        <input id="modal-lock" v-show="false" type="checkbox" v-model="form.lock" />
        <label
          v-show="role === 'ADMIN'"
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

import { getRoleFromLocalStorage } from '@/utils/token';

const role = ref(getRoleFromLocalStorage());

const props = defineProps({
  visible: Boolean,
  voucher: Object,
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: '',
});
const newFile = ref(null);

// 드래그 중 클릭 방지를 위한 상태
let isDragging = false;
const deleteTargets = ref([]); // 삭제할 file_name 목록


watch(
  () => props.visible,
  (val) => {
    if (val && props.voucher) {
      form.id = props.voucher.id;
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
    files: selectedFiles.value, // 새로 선택된 파일들
    deleteTargets: deleteTargets.value, // 삭제 대상 파일 이름들
  };
  emit('save', payload);
}
</script>
