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

      <!-- 금액 -->
      <div class="mb-4">
        <label class="block text-sm font-medium">금액</label>
        <input
          v-model="formatted"
          @input="formatCurrency"
          type="text"
          inputmode="numeric"
          class="mt-1 w-full rounded border border-gray-300 p-2"
          placeholder="금액을 입력하세요"
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

const { formatted, price, formatCurrency, setPrice } = useCurrencyFormatter();

const props = defineProps({
  visible: Boolean,
  file: Object,
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  id: '',
  name: '',
  price: '',
  withdrawn_at: '',
  company: '',
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
      setPrice(props.file.price); // 여기가 핵심
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
    price: price.value,
    file: newFile.value || null,
  };
  emit('save', payload);
}
</script>
