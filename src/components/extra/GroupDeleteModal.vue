<template>
  <div
    v-if="visible"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @click="handleBackgroundClick"
    class="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-black/40"
  >
    <div class="w-[460px] rounded-lg bg-white p-6 shadow-sm" @click.stop>
      <h2 class="mb-2 text-lg font-semibold text-gray-900">폴더 삭제</h2>
      <p class="mb-4 text-sm text-gray-500">
        삭제된 폴더와 포함된 파일은 복구할 수 없습니다.
      </p>

      <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
        <div class="flex items-start gap-2">
          <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div class="min-w-0 text-sm">
            <p class="font-semibold text-red-700">삭제 대상</p>
            <p class="mt-1 truncate text-red-700">{{ props.groupName }}</p>
            <p class="mt-2 text-red-600">
              <template v-if="isCountingFiles">포함된 파일 수를 확인하는 중입니다.</template>
              <template v-else-if="fileCount !== null">
                이 폴더에 포함된 파일 {{ fileCount }}개가 함께 삭제됩니다.
              </template>
              <template v-else>이 폴더에 포함된 모든 파일이 함께 삭제됩니다.</template>
            </p>
          </div>
        </div>
      </div>

      <div class="mb-5">
        <label class="block text-sm font-medium text-gray-700">
          최종 확인을 위해 폴더 이름을 입력해주세요.
        </label>
        <input
          v-model="userInputGroupName"
          type="text"
          class="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-800 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          :placeholder="props.groupName"
          :disabled="isDeleting"
          @keyup.enter="save"
        />
      </div>

      <div class="flex justify-end space-x-2">
        <button
          :disabled="isDeleting"
          @click="emit('close')"
          class="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          취소
        </button>
        <button
          :disabled="!canDelete || isDeleting"
          @click="save"
          class="flex min-w-20 cursor-pointer items-center justify-center gap-2 rounded border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
        >
          <Loader2 v-if="isDeleting" class="h-4 w-4 animate-spin" />
          {{ isDeleting ? '삭제 중' : '삭제' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { AlertTriangle, Loader2 } from 'lucide-vue-next';
const toast = useToast();

const userInputGroupName = ref('');

const props = defineProps({
  visible: Boolean,
  groupId: String,
  groupName: String,
  fileCount: {
    type: Number,
    default: null,
  },
  isCountingFiles: {
    type: Boolean,
    default: false,
  },
  isDeleting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'save']);
const canDelete = computed(() => normalize(userInputGroupName.value) === normalize(props.groupName || ''));

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
  if (!canDelete.value) {
    toast.error('입력한 폴더 이름이 일치하지 않습니다.');
    return;
  }
  emit('save');
}
</script>
