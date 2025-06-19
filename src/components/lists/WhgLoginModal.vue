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
      <h2 class="mb-4 text-lg font-semibold">동기화</h2>

      <!-- 연도 선택용 Flatpickr -->
      <div class="mb-4">
        <label class="block text-sm font-medium">연도 선택</label>

        <VueDatePicker
          v-model="selectedYear"
          year-picker
          auto-apply
          :action-row="{
            showSelect: false,
            showCancel: false,
          }"
        />
      </div>

      <!-- 설명 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">위하고 아이디</label>
        <input
          v-model="whgId"
          type="text"
          class="mt-1 w-full cursor-default rounded border border-gray-300 p-2"
        />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium">위하고 비밀번호</label>
        <div class="relative">
          <!-- 라벨 밖으로 빼내고 인풋만 감쌈 -->
          <input
            :type="showPassword ? 'text' : 'password'"
            v-model="whgPassword"
            class="mt-1 w-full rounded border border-gray-300 p-2 pr-10"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute inset-y-0 right-3 flex items-center"
          >
            <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-500" />
            <EyeSlashIcon v-else class="h-5 w-5 text-gray-500" />
          </button>
        </div>
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
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

const whgId = ref('');
const whgPassword = ref('');
const selectedYear = ref(new Date().getFullYear());
const showPassword = ref(false);

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
    selectedYear: selectedYear.value,
  });
  emit('close'); // 저장 후 모달 닫기
}
</script>
