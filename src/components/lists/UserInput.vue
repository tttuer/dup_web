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
          <td class="w-85 px-4 py-2 text-left">
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
                class="col-span-1 rounded-md border border-gray-300 p-0 px-1 py-0.5 text-sm"
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
import { ref } from "vue";
import Flatpickr from "vue-flatpickr-component";
import { authFetch } from "../../utils/authFetch";
import { useToast } from "vue-toastification";

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
const fileInput = ref(null);
const emit = defineEmits(["createFiles"]);
const toast = useToast();

const formatCurrency = (e) => {
  let rawValue = e.target.value;

  // , 제거한 숫자 추출
  const numberOnly = rawValue.replace(/,/g, "");

  // 숫자가 아니면 처리하지 않음 (예: 공백만 입력할 때)
  if (isNaN(numberOnly)) return;

  // 진짜 숫자 값으로 저장
  price.value = Number(numberOnly);

  // 세 자리마다 , 붙인 형식으로 다시 포맷
  formatted.value = formatNumberWithComma(numberOnly);
};

function formatNumberWithComma(price) {
  // 앞쪽 0 제거 (단, 전부 0이면 0으로 처리)
  const cleaned = price.replace(/^0+/, "") || "0";
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function handleFileChange(e) {
  files.value = e.target.files;
}

function isSuccessStatus(status) {
  return status >= 200 && status < 300;
}

async function saveFile(e) {
  const formData = new FormData();
  formData.append("company", props.selectedCompany);
  formData.append("withdrawn_at", date.value);
  formData.append("name", description.value);
  formData.append("price", price.value);

  for (const file of files.value) {
    formData.append("file_datas", file);
  }

  await authFetch("http://localhost:8080/api/files", {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      const result = await response.json();

      if (isSuccessStatus(response.status)) {
        toast.success("파일 업로드 성공");
      }

      emit("createFiles", result);
      description.value = "";
      price.value = 0;
      formatted.value = "";
      files.value = [];
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    })
    .catch((error) => {
      toast.error("파일 업로드 실패");
      console.error(error);
    });
}
</script>

<style lang="scss" scoped></style>
