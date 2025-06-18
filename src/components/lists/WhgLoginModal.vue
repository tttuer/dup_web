<!-- components/EditModal.vue -->
<template>
  <div
    v-if="visible"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @click="handleBackgroundClick"
    class="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-black/40"
  >
    <div class="w-[450px] rounded-lg bg-white p-6 shadow-sm" @click.stop>
      <h2 class="mb-4 text-lg font-semibold">권한 수정</h2>

      <!-- 설명 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">위하고 아이디</label>
        <input
          v-model="whgId"
          type="text"
          class="mt-1 w-full cursor-default rounded border border-gray-300 bg-gray-100 p-2 text-gray-600"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium">위하고 아이디</label>
        <input
          v-model="whgPassword"
          type="text"
          class="mt-1 w-full cursor-default rounded border border-gray-300 bg-gray-100 p-2 text-gray-600"
        />
      </div>

      <div class="flex justify-end space-x-2">
        <button
          @click="$emit('close')"
          class="cursor-pointer rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          취소
        </button>
        <button
          @click="save"
          class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          확인
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, onMounted } from 'vue';

const whgId = ref('');
const whgPassword = ref('');

const props = defineProps({
  visible: Boolean,
  company: String,
});

const emit = defineEmits(['close', 'save', 'whgId', 'whgPassword']);

// 드래그 중 클릭 방지를 위한 상태
let isDragging = false;

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
  emit('save', {
    whgId: whgId.value,
    whgPassword: whgPassword.value,
  });
}
</script>
