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
      <h2 class="mb-4 text-lg font-semibold">{{ title }}</h2>

      <fieldset class="mb-4">
        <legend class="mb-2 text-sm font-medium">동기화 범위</legend>
        <div class="flex gap-4">
          <label class="flex items-center gap-2">
            <input v-model="syncMode" type="radio" value="all" name="sync-mode" />
            전체 동기화
          </label>
          <label class="flex items-center gap-2">
            <input v-model="syncMode" type="radio" value="range" name="sync-mode" />
            월 범위 동기화
          </label>
        </div>
      </fieldset>

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

      <div v-if="syncMode === 'range'" class="mb-4">
        <div class="grid grid-cols-2 gap-3">
          <label class="text-sm font-medium">
            시작 월
            <select
              v-model.number="startMonth"
              class="mt-1 w-full rounded border border-gray-300 p-2"
            >
              <option v-for="month in 12" :key="month" :value="month" :disabled="month > maxMonth">
                {{ month }}월
              </option>
            </select>
          </label>
          <label class="text-sm font-medium">
            종료 월
            <select
              v-model.number="endMonth"
              class="mt-1 w-full rounded border border-gray-300 p-2"
            >
              <option
                v-for="month in 12"
                :key="month"
                :value="month"
                :disabled="month < startMonth || month > maxMonth"
              >
                {{ month }}월
              </option>
            </select>
          </label>
        </div>
        <p class="mt-2 text-sm text-gray-600">
          선택한 월만 동기화하며, 다른 월의 전표는 유지됩니다.
        </p>
      </div>
      <p v-else class="mb-4 text-sm text-gray-600">선택한 연도의 전체 전표를 동기화합니다.</p>
      <p v-if="periodError" role="alert" class="mb-4 text-sm text-red-600">{{ periodError }}</p>

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
          :disabled="Boolean(periodError)"
          class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          동기화 시작
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline';

const whgId = ref('');
const whgPassword = ref('');
const selectedYear = ref(new Date().getFullYear());
const showPassword = ref(false);
const syncMode = ref('all');
const startMonth = ref(new Date().getMonth() + 1);
const endMonth = ref(startMonth.value);
const maxMonth = computed(() => {
  const now = new Date();
  if (selectedYear.value > now.getFullYear()) return 0;
  return selectedYear.value === now.getFullYear() ? now.getMonth() + 1 : 12;
});
const periodError = computed(() => {
  if (!selectedYear.value) return '연도를 선택해주세요.';
  if (syncMode.value !== 'range') return '';
  if (startMonth.value > endMonth.value) return '종료 월은 시작 월보다 빠를 수 없습니다.';
  if (endMonth.value > maxMonth.value) return '미래의 월은 동기화할 수 없습니다.';
  return '';
});

const props = defineProps({
  visible: Boolean,
  company: String,
  title: {
    type: String,
    default: '동기화',
  },
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
  if (periodError.value) return;
  emit('save', {
    whgId: whgId.value,
    whgPassword: whgPassword.value,
    selectedYear: selectedYear.value,
    ...(syncMode.value === 'range' && {
      startMonth: startMonth.value,
      endMonth: endMonth.value,
    }),
  });
  emit('close'); // 저장 후 모달 닫기
}
</script>
