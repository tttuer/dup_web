<script setup>
import {ref, watch} from "vue";
import Dropdown from "./Dropdown.vue"
import DateHeader from "./DateHeader.vue";

const File = ({
                created_at = "",
                file_name = "",
                id = "",
                name = "",
                price = 0,
                updated_at = "",
                withdrawn_at = "",
                file_data = "",
              }) => ({created_at, file_name, id, name, price, updated_at, withdrawn_at, file_data});

const isOpen = ref(false)
const selectedCompany = ref('')
const fileLists = ref([])
const totalPage = ref(0)

function handleOpen() {
  isOpen.value = !isOpen.value
  console.log(isOpen.value)
}

async function fetchFiles() {
  const response = await fetch(
      'http://localhost:8080/api/files'
  )
  const [page, lists] = await response.json()

  totalPage.value = page
  fileLists.value = lists.map(File)

  console.log(fileLists.value)

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


watch(selectedCompany, fetchFiles)

</script>

<template>

  <Dropdown @select="(select) => selectedCompany = select"/>
  <div
      class="w-full mx-auto h-[calc(100vh-80px)] flex flex-col bg-white rounded-lg overflow-hidden outline outline-white/5 dark:bg-gray-950/50 border-2 border-gray-200 dark:border-gray-700">
    <!-- 고정 헤더 테이블 -->

    <div>
      <table class="w-full table-fixed">
        <thead class="bg-gray-100 dark:bg-gray-700">
        <tr>
          <th class="w-5 text-left px-4 py-2">
            <input type="checkbox" id="check-all"/>
          </th>
          <DateHeader />
<!--          <th @click="handleOpen" class="w-30 text-left px-4 py-2 cursor-pointer select-none group hover:bg-blue-50" id="date-header">-->
<!--            날짜-->
<!--            <span class="ml-1 text-sm text-gray-400 group-hover:text-blue-500">📅</span>-->
<!--            <input v-show="isOpen" type="date" id="date-input">-->
<!--          </th>-->
          <th class="w-auto text-left px-4 py-2">설명</th>
          <th class="w-40 text-left px-4 py-2">금액</th>
          <th class="w-50 text-left px-4 py-2">첨부파일</th>
        </tr>
        </thead>
      </table>
    </div>

    <!-- 스크롤 가능한 바디 테이블 -->
    <div class="flex-1 overflow-y-auto">
      <table class="w-full table-fixed">
        <tbody>
        <!-- 반복 행 예시 -->
        <tr v-for="file in fileLists" :key="file.id"
            class="border-b border-gray-200 dark:border-gray-700">
          <td class="w-5 px-4 py-2"><input type="checkbox" class="row-check"/></td>
          <td class="w-30 px-4 py-2">{{ formatDate(file.withdrawn_at) }}</td>
          <td class="w-auto px-4 py-2">{{ file.name }}</td>
          <td class="w-40 px-4 py-2">{{ formatPrice(file.price) }}</td>
          <td class="w-50 px-4 py-2">{{ file.file_name }}</td>
        </tr>
        <!--        <tr class="border-b border-gray-200 dark:border-gray-700">-->
        <!--          <td class="w-5 px-4 py-2"><input type="checkbox" class="row-check"/></td>-->
        <!--          <td class="w-30 px-4 py-2">2025/03/27</td>-->
        <!--          <td class="w-auto px-4 py-2">회의비</td>-->
        <!--          <td class="w-40 px-4 py-2">₩25,000</td>-->
        <!--          <td class="w-50 px-4 py-2">receipt.pdf</td>-->
        <!--        </tr>-->
        <!-- 더 많은 행들 -->
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>

</style>