<!-- components/EditModal.vue -->
<template>
  <div
    v-if="visible"
    @click="$emit('close')"
    class="backdrop-blur-2xs fixed inset-0 z-50 flex items-center justify-center"
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
          v-model.number="form.price"
          type="number"
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

watch(
  () => props.file,
  (file) => {
    if (file) {
      form.id = file.id;
      form.name = file.name;
      form.price = file.price;
      form.withdrawn_at = file.withdrawn_at; // "2025-03-20" 형식
      form.company = file.company;
    }
  },
  { immediate: true },
);

function handleFileChange(event) {
  newFile.value = event.target.files[0];
}

function save() {
  const payload = {
    ...form,
    file: newFile.value || null,
  };
  emit('save', payload);
}
</script>
