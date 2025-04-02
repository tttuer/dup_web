<script setup>
import { ref, watch } from "vue";
import Dropdown from "./Dropdown.vue";
import DateHeader from "./DateHeader.vue";
import { authFetch } from "../../utils/authFetch";
const File = ({
  created_at = "",
  file_name = "",
  id = "",
  name = "",
  price = 0,
  company = "",
  updated_at = "",
  withdrawn_at = "",
  file_data = "",
}) => ({
  created_at,
  file_name,
  id,
  name,
  price,
  company,
  updated_at,
  withdrawn_at,
  file_data,
});

const isLoading = ref(false);
const selectedCompany = ref("");
const selectedDate = ref("");
const fileLists = ref([]);
const totalPage = ref(0);

async function fetchFiles() {
  fileLists.value = [];
  totalPage.value = 0;

  const params = new URLSearchParams();
  params.append("company", selectedCompany.value);
  params.append("start_at", selectedDate.value);

  isLoading.value = true;
  try {
    const response = await authFetch(
      "http://localhost:8080/api/files?" + params.toString(),
    );
    const [page, lists] = await response.json();

    totalPage.value = page;
    fileLists.value = lists.map(File);
  } finally {
    isLoading.value = false;
  }
}

// 날짜 포맷 함수
function formatDate(dateStr) {
  // 입력값이 "20250320" 형식일 경우 처리
  const year = dateStr.substring(0, 4); // "2025"
  const month = dateStr.substring(4, 6); // "03"
  const day = dateStr.substring(6, 8); // "20"

  // YYYY/MM/DD 형식으로 반환
  return `${year}/${month}/${day}`;
}

// 금액 포맷 함수 (세 자리 콤마 추가)
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

watch([selectedCompany, selectedDate], fetchFiles);
</script>

<template>
  <Dropdown @select="(select) => (selectedCompany = select)" />
  <div
    class="mx-auto flex h-[calc(100vh-80px)] w-full flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50"
  >
    <!-- 고정 헤더 테이블 -->

    <div>
      <table class="w-full table-fixed">
        <thead class="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th class="w-5 px-4 py-2 text-left">
              <input type="checkbox" id="check-all" />
            </th>
            <DateHeader @select="(select) => (selectedDate = select)" />
            <th class="w-auto px-4 py-2 text-left">설명</th>
            <th class="w-45 px-4 py-2 text-left">금액</th>
            <th class="w-85 px-4 py-2 text-left">첨부파일</th>
          </tr>
        </thead>
      </table>
    </div>

    <!-- 스크롤 가능한 바디 테이블 -->
    <div class="flex-1 overflow-y-auto">
      <table class="w-full table-fixed">
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5" class="px-4 py-4 text-center">
              <svg
                class="mx-auto size-6 animate-spin text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <p class="mt-2 text-sm text-gray-500 dark:text-gray-300">
                불러오는 중...
              </p>
            </td>
          </tr>
          <!-- 반복 행 예시 -->
          <tr
            v-for="file in fileLists"
            :key="file.id"
            class="border-b border-gray-200 dark:border-gray-700"
          >
            <td class="w-5 px-4 py-2">
              <input type="checkbox" class="row-check" />
            </td>
            <td class="w-45 px-4 py-2">{{ formatDate(file.withdrawn_at) }}</td>
            <td class="w-auto px-4 py-2">{{ file.name }}</td>
            <td class="w-45 px-4 py-2">{{ formatPrice(file.price) }}</td>
            <td class="group relative w-85 px-4 py-2">
              <div class="group relative inline-block">
                <a
                  :href="`data:application/pdf;base64,${file.file_data}`"
                  :download="file.file_name"
                  class="text-blue-500 hover:text-blue-600"
                  >{{ file.file_name }}</a
                >
                <div
                  class="absolute top-full left-0 z-10 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
                >
                  <embed
                    :src="`data:application/pdf;base64,${file.file_data}`"
                    type="application/pdf"
                    class="h-full w-full"
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped></style>
