<template>
  <div v-if="selectedCompany" class="block border-b border-gray-200">
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
          <td class="w-85 px-4 py-2 text-left">
            <div class="grid grid-cols-4 gap-4">
              <input
                class="col-span-3 flex w-full rounded-sm border border-gray-300 pl-1"
                type="file"
                multiple
                @change="handleFileChange"
              />
              <button
                class="col-span-1 rounded-md border border-gray-300 p-0 px-1 py-0.5 text-sm"
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
import { ref } from "vue";
import Flatpickr from "vue-flatpickr-component";

const props = defineProps({
  selectedCompany: String,
});
const date = ref(null);
const config = {
  dateFormat: "Ymd",
};
const formatted = ref("");
const price = ref(0);
const description = ref("");
const files = ref([]);

const formatCurrency = (e) => {
  let value = e.target.value;

  price.value = Number(value);
  // 세 자리마다 , 찍기
  formatted.value = Number(value).toLocaleString();
};

function handleFileChange(e) {
  files.value = e.target.files;

  console.log(files.value);
}

function saveFile(e) {
  authFetch("http://localhost:8080/api/files", {
    method: "POST",
    body: JSON.stringify({
      company: props.selectedCompany,
      date: date.value,
      description: description.value,
      price: price.value,
      files: files.value,
    }),
  });
}

</script>

<style lang="scss" scoped></style>
