<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  voucherId: {
    type: String,
    required: true,
  },
  files: {
    type: Array,
    default: () => [],
  },
  uploading: {
    type: Boolean,
    default: false,
  },
  dropActive: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['download', 'upload']);

const inputId = computed(() => `voucher-files-${props.voucherId}`);
const fileLabel = computed(() => {
  if (!props.files.length) return '';
  if (props.files.length === 1) return props.files[0].file_name;
  return `${props.files[0].file_name} 외 ${props.files.length - 1}건`;
});
function submitFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length || props.uploading) return;

  emit('upload', files);
}

function handleFileChange(event) {
  submitFiles(event.target.files);
  event.target.value = '';
}

</script>

<template>
  <div
    class="group flex min-h-8 w-full items-center rounded-md border border-transparent transition-colors"
    :class="{ 'cursor-wait opacity-70': uploading }"
  >
    <template v-if="dropActive">
      <span class="w-full text-center text-sm font-semibold text-blue-700">이 전표에 첨부합니다</span>
    </template>

    <template v-else-if="files.length">
      <span v-if="uploading" class="text-xs text-gray-500">업로드 중...</span>
      <button
        v-else
        type="button"
        class="min-w-0 flex-1 truncate text-left text-blue-500 hover:text-blue-600"
        :title="fileLabel"
        @click="emit('download')"
      >
        {{ fileLabel }}
      </button>
      <label
        v-if="!uploading"
        :for="inputId"
        class="ml-2 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border border-gray-200 text-base font-medium text-gray-500 opacity-0 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100 focus-within:opacity-100"
        title="첨부파일 추가"
      >
        <span aria-hidden="true">+</span>
        <input
          :id="inputId"
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
          class="sr-only"
          :disabled="uploading"
          @change="handleFileChange"
        />
      </label>
    </template>

    <label
      v-else
      :for="inputId"
      class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
      :class="{ 'cursor-wait': uploading }"
    >
      <span v-if="uploading">업로드 중...</span>
      <span v-else>파일을 끌어놓거나 클릭</span>
      <input
        :id="inputId"
        type="file"
        multiple
        accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
        class="sr-only"
        :disabled="uploading"
        @change="handleFileChange"
      />
    </label>

  </div>
</template>
