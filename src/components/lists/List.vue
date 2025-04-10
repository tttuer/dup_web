<script setup>
import { ref, watch, onUnmounted, nextTick } from "vue";
import Dropdown from "./Dropdown.vue";
import { authFetch } from "../../utils/authFetch";
import Sentinel from "./Sentinel.vue";
import DateSearch from "./DateSearch.vue";

const previewUrlCache = new Map();
const worker = new Worker(new URL("./pdf-worker.js", import.meta.url), {
  type: "module",
});

worker.onmessage = (e) => {
  const { id, pdf_url } = e.data;
  previewUrlCache.set(id, pdf_url);
  const file = fileLists.value.find((f) => f.id === id);
  if (file) {
    file.pdf_url = pdf_url;
  }
};

const isLoading = ref(false);
const selectedCompany = ref("");
const selectedDate = ref("");
const fileLists = ref([]);
const totalPage = ref(0);
const currentPage = ref(1);
const isPdfConverting = ref(false); // PDF URL 생성 로딩 상태
const start_at = ref("");
const end_at = ref("");
const companyOptions = ["백성운수", "평택여객", "파란전기"];
const companyNameToEnum = {
  백성운수: "BAEKSUNG",
  평택여객: "PYEONGTAEK",
  파란전기: "PARAN",
};
const searchbar = ref("");
const searchbarOption = ref("");

import UserInput from "./UserInput.vue";
import Searchbar from "./Searchbar.vue";

function addCreatedFiles() {
  fetchFiles(true);
}

async function fetchFiles(isReset = false) {
  if (isReset) {
    fileLists.value = [];
    totalPage.value = 0;
    currentPage.value = 1;
  }

  const params = new URLSearchParams();

  params.append("company", selectedCompany.value);
  params.append("start_at", start_at.value ? start_at.value : "");
  params.append("end_at", end_at.value ? end_at.value : "");
  params.append("page", currentPage.value);
  params.append("search", searchbar.value);
  params.append("search_option", searchbarOption.value);

  isLoading.value = true;
  isPdfConverting.value = true;
  try {
    const response = await authFetch(
      "http://localhost:8080/api/files?" + params.toString(),
    );
    const [total_count, total_page, lists] = await response.json();

    totalPage.value = total_page;
    const newFiles = lists.map((file) => ({
      ...file,
      pdf_url: null, // 나중에 Worker가 채워줌
    }));
    fileLists.value = [...fileLists.value, ...newFiles];

    newFiles.forEach((file) => {
      if (!previewUrlCache.has(file.id)) {
        worker.postMessage({ id: file.id, file_data: file.file_data });
      } else {
        file.pdf_url = previewUrlCache.get(file.id);
      }
    });
  } finally {
    isLoading.value = false;
    isPdfConverting.value = false;
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

// *** 미리보기 위치 계산 및 조정 함수 ***
function handlePreviewPosition(event) {
  const container = event.currentTarget; // 이벤트가 부착된 요소 (div.group.relative.inline-block)
  const preview = container.querySelector(".pdf-preview"); // 미리보기 div (클래스 추가 필요)
  if (!preview) return;

  const containerRect = container.getBoundingClientRect(); // 컨테이너의 뷰포트 내 위치/크기
  const previewHeight = preview.offsetHeight || 600; // 미리보기 높이 (h-80 = 20rem = 320px), 실제 측정값 사용 권장
  const viewportHeight = window.innerHeight; // 뷰포트 높이
  const spaceBelow = viewportHeight - containerRect.bottom; // 요소 아래 남은 공간
  const spaceAbove = containerRect.top; // 요소 위 남은 공간 (뷰포트 상단 기준)

  // 기본값: 아래로 표시
  preview.classList.remove("bottom-full", "mb-2"); // '위로' 스타일 제거
  preview.classList.add("top-full", "mt-2"); // '아래로' 스타일 추가 (기본)

  // 아래 공간이 부족하고 위 공간이 충분하면 위로 표시
  if (spaceBelow < previewHeight && spaceAbove > previewHeight) {
    preview.classList.remove("top-full", "mt-2"); // '아래로' 스타일 제거
    preview.classList.add("bottom-full", "mb-2"); // '위로' 스타일 추가 (mb-2는 위쪽 여백)
  }
  // 다른 경우는 기본값(아래로 표시) 유지
}

// *** 마우스 벗어날 때 스타일 초기화 함수 (선택적이지만 권장) ***
function resetPreviewPosition(event) {
  const container = event.currentTarget;
  const preview = container.querySelector(".pdf-preview");
  if (!preview) return;

  // 기본 '아래로' 스타일로 복원
  preview.classList.remove("bottom-full", "mb-2");
  preview.classList.add("top-full", "mt-2");
}

function handleIntersect() {
  if (
    !isLoading.value &&
    !isPdfConverting.value &&
    currentPage.value < totalPage.value
  ) {
    currentPage.value++;
    fetchFiles();
  }
}

function search() {
  fetchFiles(true);
}

// 메모리 누수 방지용 URL 저장소
const objectUrls = new Map();

// 컴포넌트가 사라질 때 URL 정리
onUnmounted(() => {
  for (const url of objectUrls.values()) {
    URL.revokeObjectURL(url);
  }
});

watch([selectedCompany, selectedDate], async () => {
  await fetchFiles(true);
});
</script>

<template>
  <div class="bg-testPink flex h-full w-full flex-col p-8">
    <div class="grid grid-cols-2">
      <Dropdown
        class="col-span-1"
        @select="(select) => (selectedCompany = select)"
        :options="companyOptions"
        :nameToEnum="companyNameToEnum"
      />
      <div class="col-span-1 flex flex-row justify-end">
        <DateSearch
          @search="
            ({ start_at: s, end_at: e }) => {
              start_at = s;
              end_at = e;
            }
          "
        />
        <Searchbar
          class="ml-3"
          @search="
            ({ search: s, searchOption: so }) => {
              searchbar = s;
              searchbarOption = so;
            }
          "
        />
        <div
          class="ml-2 h-9 w-9 cursor-pointer rounded-sm hover:bg-black hover:text-white"
          @click="search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-9"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
      </div>
    </div>
    <div
      class="flex h-full w-full flex-1 flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50"
    >
      <!-- 고정 헤더 테이블 -->

      <div class="block">
        <table class="w-full min-w-[900px] table-fixed">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th class="w-5 px-4 py-2 text-left">
                <input type="checkbox" id="check-all" />
              </th>
              <th class="w-45 px-4 py-2 text-left">날짜</th>
              <th class="min-w-48 truncate px-4 py-2 text-left">설명</th>
              <th class="w-45 px-4 py-2 text-left">금액</th>
              <th class="w-85 px-4 py-2 text-left">첨부파일</th>
            </tr>
          </thead>
        </table>
      </div>

      <UserInput
        :selectedCompany="selectedCompany"
        @createFiles="addCreatedFiles"
      />

      <div class="no-scrollbar h-full overflow-y-scroll">
        <table class="w-full min-w-[900px] table-fixed">
          <tbody>
            <!-- 반복 행 예시 -->
            <tr
              v-for="file in fileLists"
              :key="file.id"
              class="files border-b border-gray-200 dark:border-gray-700"
            >
              <td class="w-5 px-4 py-2">
                <input type="checkbox" class="row-check" />
              </td>
              <td class="w-45 px-4 py-2">
                {{ formatDate(file.withdrawn_at) }}
              </td>
              <td class="truncate px-4 py-2">
                {{ file.name }}
              </td>
              <td class="w-45 px-4 py-2">{{ formatPrice(file.price) }}</td>
              <td
                class="group relative w-85 px-4 py-2"
                @mouseenter="handlePreviewPosition"
                @mouseleave="resetPreviewPosition"
              >
                <div class="group relative inline-block">
                  <a
                    :href="`data:application/pdf;base64,${file.file_data}`"
                    :download="file.file_name"
                    class="truncate text-blue-500 hover:text-blue-600"
                    >{{ file.file_name }}</a
                  >
                  <div
                    class="pdf-preview absolute top-full left-0 z-10 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
                  >
                    <embed
                      v-if="file.pdf_url"
                      :src="file.pdf_url"
                      type="application/pdf"
                      class="h-full w-full"
                    />
                  </div>
                </div>
              </td>
            </tr>
            <Sentinel
              v-if="currentPage < totalPage"
              :onIntersect="handleIntersect"
            />
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
