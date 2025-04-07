<script setup>
import { ref, watch, onUnmounted, nextTick } from "vue";
import Dropdown from "./Dropdown.vue";
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
const currentPage = ref(1);
const sentinel = ref(null);
let observer = null;

import { onUpdated } from "vue";

onUpdated(async () => {
  if (sentinel.value && !observer) {
    await nextTick();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !isLoading.value &&
            currentPage.value < totalPage.value
          ) {
            currentPage.value++;
            fetchFiles();
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
      },
    );

    observer.observe(sentinel.value);
  }
});

// 컴포넌트 unmount 시 observer 정리 (메모리 누수 방지)
import { onBeforeUnmount } from "vue";
import UserInput from "./UserInput.vue";
onBeforeUnmount(() => {
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value);
  }
  if (observer) {
    observer.disconnect();
  }
  observer = null;
});

function addCreatedFiles(files) {
  fileLists.value.push(...files.map(File));

  // 다음 렌더링 이후 실행
  nextTick(() => {
    const lastItem = document.querySelector(".files:last-child");
    if (lastItem) {
      lastItem.scrollIntoView({ behavior: "smooth" }); // 👈 스무스하게 스크롤
    }
  });
}

async function fetchFiles(isReset = false) {
  if (isReset) {
    fileLists.value = [];
    totalPage.value = 0;
    currentPage.value = 1;
  }

  const params = new URLSearchParams();
  params.append("company", selectedCompany.value);
  params.append("start_at", selectedDate.value);
  params.append("page", currentPage.value);

  isLoading.value = true;
  try {
    const response = await authFetch(
      "http://localhost:8080/api/files?" + params.toString(),
    );
    const [total_count, total_page, lists] = await response.json();

    totalPage.value = total_page;
    fileLists.value = [...fileLists.value, ...lists.map(File)];
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

// 메모리 누수 방지용 URL 저장소
const objectUrls = new Map();

// base64 → blob → URL 변환 함수
function getPdfUrl(file) {
  if (!file?.file_data) return null;

  // 이미 URL이 만들어졌으면 그대로 반환
  if (objectUrls.has(file.id)) return objectUrls.get(file.id);

  try {
    const byteCharacters = atob(file.file_data);
    const byteArray = new Uint8Array(
      [...byteCharacters].map((c) => c.charCodeAt(0)),
    );
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    objectUrls.set(file.id, url);
    return url;
  } catch (e) {
    console.error("Failed to create PDF URL:", e);
    return null;
  }
}

// 컴포넌트가 사라질 때 URL 정리
onUnmounted(() => {
  for (const url of objectUrls.values()) {
    URL.revokeObjectURL(url);
  }
});

watch([selectedCompany, selectedDate], () => {
  fetchFiles(true);
});
</script>

<template>
  <div class="bg-testPink flex h-full w-full flex-col p-8">
    <Dropdown @select="(select) => (selectedCompany = select)" />
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
              class="border-b border-gray-200 dark:border-gray-700 files"
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
                      v-if="getPdfUrl(file)"
                      :src="getPdfUrl(file)"
                      type="application/pdf"
                      class="h-full w-full"
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr ref="sentinel">
              <td
                colspan="5"
                class="px-4 py-4 text-center"
                v-if="currentPage < totalPage"
              >
                <div v-if="currentPage < totalPage">
                  <svg
                    class="size-6 animate-spin text-gray-500"
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
