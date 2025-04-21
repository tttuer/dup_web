<template>
  <div v-if="selectedCompany" class="block border-b border-gray-200 bg-gray-50">
    <table class="w-full min-w-[900px] table-fixed">
      <thead class="">
        <tr>
          <td class="w-5 px-4 py-2 text-left"></td>
          <td class="w-45 px-4 py-2">
            <Flatpickr
              class="w-full rounded-sm border border-gray-300"
              v-model="date"
              :config="config"
              placeholder="날짜를 선택하세요"
            />
          </td>
          <td class="min-w-48 truncate px-4 py-2 text-left">
            <input
              class="w-full rounded-sm border border-gray-300 pl-1"
              type="text"
              placeholder="설명을 입력하세요"
              v-model="description"
            />
          </td>
          <td class="w-45 px-4 py-2 text-left">
            <input
              class="w-full rounded-sm border border-gray-300 pl-1"
              type="text"
              placeholder="금액을 입력하세요"
              v-model="formatted"
              @input="formatCurrency"
              pattern="\d*"
            />
          </td>
          <td class="w-90 px-4 py-2 text-left">
            <div class="grid grid-cols-4 gap-4">
              <input
                ref="fileInput"
                class="col-span-3 flex w-full rounded-sm border border-gray-300 pl-1"
                type="file"
                multiple
                accept=".pdf, .jpg, .jpeg, .png"
                @change="handleFileChange"
              />
              <button
                class="col-span-1 w-15 cursor-pointer rounded-md border border-gray-300 p-0 px-1 py-0.5 text-sm hover:bg-black hover:text-white"
                @click="saveFile"
              >
                입력
              </button>
            </div>
          </td>
        </tr>
      </thead>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Flatpickr from 'vue-flatpickr-component';
import { authFetch } from '../../utils/authFetch';
import { useToast } from 'vue-toastification';
import { useCurrencyFormatter } from '@/utils/currencyFormatter';

const fileApiUrl = `${import.meta.env.VITE_FILE_API_URL}`;

const props = defineProps({
  selectedCompany: String,
});
const date = ref(null);
const config = {
  dateFormat: 'Ymd',
};
const description = ref('');
const files = ref([]);
const fileInput = ref(null);
const emit = defineEmits(['createFiles']);
const toast = useToast();
const { formatted, price, formatCurrency } = useCurrencyFormatter();

function handleFileChange(e) {
  files.value = e.target.files;
}

async function saveFile(e) {
  const formData = new FormData();
  formData.append('company', props.selectedCompany);
  formData.append('withdrawn_at', date.value);
  formData.append('name', description.value);
  formData.append('price', price.value);

  for (const file of files.value) {
    formData.append('file_datas', file);
  }

  await authFetch(fileApiUrl, {
    method: 'POST',
    body: formData,
  })
    .then(async (response) => {
      const result = await response.json();

      if (response.ok) {
        toast.success('파일 업로드 성공');
      }

      emit('createFiles', result);
      // 저장 후 리셋하는 부분
      description.value = '';
      files.value = [];
      if (fileInput.value) fileInput.value.value = '';
      price.value = null; // null이 Composable에서 허용되게 변경했으니
      formatted.value = '';
    })
    .catch((error) => {
      toast.error('파일 업로드 실패');
      console.error(error);
    });
}
</script>

<style lang="scss" scoped></style>
