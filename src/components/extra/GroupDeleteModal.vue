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
      <h2 class="mb-4 text-lg font-semibold">그룹 삭제</h2>

      <!-- 설명 -->
      <div class="mb-4">
        <label class="block text-sm font-medium"
          >삭제할 그룹 이름을 입력해주세요( {{ props.groupName }} )</label
        >
        <input
          v-model="userInputGroupName"
          type="text"
          class="mt-1 w-full cursor-default rounded border border-black-300 p-2 text-gray-800"
          :placeholder="props.groupName"
        />
      </div>

      <div class="mb-4 flex items-center space-x-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-5 text-red-500"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>

        <label class="font-xs block text-sm text-red-500"
          >그룹 삭제 시 그룹에 포함된 파일 모두 삭제됩니다</label
        >
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
          class="cursor-pointer rounded px-4 py-2 border border-gray-300 hover:bg-red-500 hover:text-white text-sm font-semibold"
        >
          삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
const toast = useToast();

const userInputGroupName = ref('');

const props = defineProps({
  visible: Boolean,
  groupId: String,
  groupName: String,
});

const emit = defineEmits(['close', 'save']);

// 드래그 중 클릭 방지를 위한 상태
let isDragging = false;

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      userInputGroupName.value = '';
    }
  },
);

function normalize(str) {
  return str.trim().normalize('NFC');
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
  if (userInputGroupName.value.trim() !== props.groupName) {
    toast.error('입력한 그룹 이름이 일치하지 않습니다.');
    return;
  }
  emit('save');
}
</script>
