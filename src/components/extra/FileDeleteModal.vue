<!-- components/FileDeleteModal.vue -->
<template>
  <div
    v-if="visible"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @click="handleBackgroundClick"
    class="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-black/40"
  >
    <div class="w-[450px] rounded-lg bg-white p-6 shadow-sm" @click.stop>
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-red-500">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          <h2 class="text-lg font-semibold">파일 삭제 확인</h2>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p class="mb-4 text-sm text-gray-700">삭제하시겠습니까? 삭제할 파일들을 확인해 주세요.</p>

      <div class="mb-4 max-h-40 overflow-y-auto rounded border border-gray-200">
        <ul class="divide-y divide-gray-100 bg-gray-50/50">
          <li v-for="file in props.files" :key="file.id" class="flex items-center px-4 py-2 text-sm text-gray-700">
            <svg class="mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span class="truncate">{{ file.file_name }}</span>
          </li>
        </ul>
      </div>

      <div class="mb-4">
        <label class="font-xs block text-sm text-gray-800">
          최종 확인을 위해 아래에 <span class="font-bold text-red-500">"삭제하겠습니다"</span>를 입력해 주세요.
        </label>
        <input
          v-model="deleteConfirmationText"
          type="text"
          class="mt-2 w-full cursor-text rounded border border-gray-300 p-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
          placeholder='"삭제하겠습니다" 입력'
        />
      </div>

      <div class="flex justify-end space-x-2">
        <button
          @click="$emit('close')"
          class="cursor-pointer rounded border border-gray-300 px-4 py-2 hover:bg-gray-300"
        >
          취소
        </button>
        <button
          @click="save"
          class="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-red-500 hover:text-white"
        >
          삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();
const props = defineProps({
  visible: Boolean,
  files: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'save']);
const deleteConfirmationText = ref('');

// 드래그 중 클릭 방지를 위한 상태
let isDragging = false;

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      deleteConfirmationText.value = '';
    }
  }
);

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
  if (deleteConfirmationText.value.trim() !== '삭제하겠습니다') {
    toast.error('"삭제하겠습니다"를 정확히 입력해주세요.');
    return;
  }
  emit('save');
}
</script>
