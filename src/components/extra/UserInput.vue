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
          <td class="w-69 px-4 py-2 text-left">
            <div class="flex gap-1.5">
              <input
                :class="role === 'ADMIN' ? 'col-span-3' : 'col-span-4'"
                ref="fileInput"
                class="flex w-full rounded-sm border border-gray-300 pl-1"
                type="file"
                multiple
                accept=".pdf, .jpg, .jpeg, .png"
                @change="handleFileChange"
              />
              <input id="lock" v-show="false" type="checkbox" v-model="isLocked" />
              <label
                v-show="role === 'ADMIN'"
                for="lock"
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-300 hover:bg-gray-200"
              >
                <svg
                  v-if="isLocked"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-gray-800"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-3 0H9V9a3 3 0 1 1 6 0v2z"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </label>
            </div>
          </td>
          <td class="w-21">
            <button
              class="col-span-1 w-15 cursor-pointer rounded-md border border-gray-300 p-0 px-1 py-0.5 text-sm hover:bg-black hover:text-white"
              @click="saveFile"
            >
              입력
            </button>
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
import { useTypeStore } from '@/stores/typeStore'
import { getRoleFromLocalStorage } from '@/utils/token';

const role = ref(getRoleFromLocalStorage());

const typeStroe = useTypeStore();

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
const isLocked = ref(false);


function handleFileChange(e) {
  files.value = e.target.files;
}

async function saveFile(e) {
  const formData = new FormData();
  formData.append('type', typeStroe.currentType)
  formData.append('company', props.selectedCompany);
  formData.append('withdrawn_at', date.value);
  formData.append('name', description.value);
  formData.append('lock', isLocked.value);

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
