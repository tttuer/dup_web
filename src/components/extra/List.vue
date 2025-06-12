<script setup>
import { ref, watch, onUnmounted, computed, onMounted, nextTick } from 'vue';
import Dropdown from './Dropdown.vue';
import { authFetch } from '../../utils/authFetch';
import Sentinel from './Sentinel.vue';
import DateSearch from './DateSearch.vue';
import EditModal from './EditModal.vue';
import { useTypeStore } from '@/stores/typeStore';
import { getRoleFromLocalStorage } from '@/utils/token';
import { groupOptions, groupNameToEnum, groupIdToName, loadGroupOptions } from '@/stores/group';
const selectedGroup = ref('');
const roles = ref(getRoleFromLocalStorage());

const typeStore = useTypeStore();

const previewUrlCache = new Map();
const worker = new Worker(new URL('./pdf-worker.js', import.meta.url), {
  type: 'module',
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
const selectedCompany = ref('');
const selectedDate = ref('');
const fileLists = ref([]);
const totalPage = ref(0);
const currentPage = ref(1);
const isPdfConverting = ref(false); // PDF URL 생성 로딩 상태
const start_at = ref('');
const end_at = ref('');
const companyOptions = ['백성운수', '평택여객', '파란전기'];
const companyNameToEnum = {
  백성운수: 'BAEKSUNG',
  평택여객: 'PYEONGTAEK',
  파란전기: 'PARAN',
};
const searchbar = ref('');
const searchbarOption = ref('');

const checkedIds = ref(new Set()); // ✅ 체크된 파일의 id 저장
const lastCheckedIndex = ref(null);
const hasChecked = computed(() => checkedIds.value.size > 0);

const handleCheckboxClick = (event, index) => {
  const file = fileLists.value[index];
  const id = file.id;

  if (event.shiftKey && lastCheckedIndex.value !== null) {
    const start = Math.min(lastCheckedIndex.value, index);
    const end = Math.max(lastCheckedIndex.value, index);

    const rangeFiles = fileLists.value.slice(start, end + 1);

    const clickedWasChecked = checkedIds.value.has(id);

    rangeFiles.forEach((f) => {
      if (clickedWasChecked) {
        checkedIds.value.delete(f.id); // 전체 해제
      } else {
        checkedIds.value.add(f.id); // 전체 체크
      }
    });

    // ✅ 기준점 갱신! ← 이게 핵심
    lastCheckedIndex.value = index;
  } else {
    // 일반 클릭 (토글)
    if (checkedIds.value.has(id)) {
      checkedIds.value.delete(id);
    } else {
      checkedIds.value.add(id);
    }

    // 기준점 갱신
    lastCheckedIndex.value = index;
  }
};

import UserInput from './UserInput.vue';
import Searchbar from './Searchbar.vue';
import { useToast } from 'vue-toastification';
import { files } from 'jszip';
import { file } from 'jszip';

const fileUrl = `${import.meta.env.VITE_FILE_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const editTargetFile = ref(null);
const lockFilter = ref(false);

function openEditModal(file) {
  editTargetFile.value = file;
  isEditModalOpen.value = true;
}

function closeEditModal() {
  isEditModalOpen.value = false;
  editTargetFile.value = null;
}

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
  params.append('type', typeStore.currentType);
  params.append('company', selectedCompany.value);
  params.append('start_at', start_at.value ? start_at.value : '');
  params.append('end_at', end_at.value ? end_at.value : '');
  params.append('page', currentPage.value);
  params.append('search', searchbar.value);
  params.append('search_option', searchbarOption.value);
  params.append('is_locked', lockFilter.value);
  params.append('group_id', selectedGroup.value);

  isLoading.value = true;
  isPdfConverting.value = true;
  try {
    const response = await authFetch(fileUrl + '?' + params.toString());
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

async function deleteFiles() {
  const query = [...checkedIds.value].map((id) => `ids=${id}`).join('&');

  try {
    const response = await authFetch(`${fileUrl}?${query}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      toast.success('파일 삭제 성공');
      checkedIds.value.clear();
      fetchFiles(true);
    } else {
      toast.error('파일 삭제 실패');
    }
  } catch (error) {
    toast.error('파일 삭제 실패');
    console.error(error);
  }
}

async function editFile(payload) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('price', payload.price);
  formData.append('withdrawn_at', payload.withdrawn_at);
  formData.append('lock', payload.lock);
  formData.append('group_id', payload.group_id);

  if (payload.file) {
    formData.append('file_data', payload.file);
  }

  try {
    const response = await authFetch(`${fileUrl}/${payload.id}`, {
      method: 'PUT',
      body: formData,
    });

    if (response.ok) {
      toast.success('수정 완료');
      closeEditModal();
      fetchFiles(true);
    } else {
      toast.error('수정 실패');
    }
  } catch (e) {
    toast.error('수정 중 오류 발생');
    console.error(e);
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
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// *** 미리보기 위치 계산 및 조정 함수 ***
function handlePreviewPosition(event) {
  const container = event.currentTarget; // 이벤트가 부착된 요소 (div.group.relative.inline-block)
  const preview = container.querySelector('.pdf-preview'); // 미리보기 div (클래스 추가 필요)
  if (!preview) return;

  const containerRect = container.getBoundingClientRect(); // 컨테이너의 뷰포트 내 위치/크기
  const previewHeight = preview.offsetHeight || 600; // 미리보기 높이 (h-80 = 20rem = 320px), 실제 측정값 사용 권장
  const viewportHeight = window.innerHeight; // 뷰포트 높이
  const spaceBelow = viewportHeight - containerRect.bottom; // 요소 아래 남은 공간
  const spaceAbove = containerRect.top; // 요소 위 남은 공간 (뷰포트 상단 기준)

  // 기본값: 아래로 표시
  preview.classList.remove('bottom-full', 'mb-2'); // '위로' 스타일 제거
  preview.classList.add('top-full', 'mt-2'); // '아래로' 스타일 추가 (기본)

  // 아래 공간이 부족하고 위 공간이 충분하면 위로 표시
  if (spaceBelow < previewHeight && spaceAbove > previewHeight) {
    preview.classList.remove('top-full', 'mt-2'); // '아래로' 스타일 제거
    preview.classList.add('bottom-full', 'mb-2'); // '위로' 스타일 추가 (mb-2는 위쪽 여백)
  }
  // 다른 경우는 기본값(아래로 표시) 유지
}

// *** 마우스 벗어날 때 스타일 초기화 함수 (선택적이지만 권장) ***
function resetPreviewPosition(event) {
  const container = event.currentTarget;
  const preview = container.querySelector('.pdf-preview');
  if (!preview) return;

  // 기본 '아래로' 스타일로 복원
  preview.classList.remove('bottom-full', 'mb-2');
  preview.classList.add('top-full', 'mt-2');
}

function handleIntersect() {
  if (!isLoading.value && !isPdfConverting.value && currentPage.value < totalPage.value) {
    currentPage.value++;
    fetchFiles();
  }
}

function search() {
  fetchFiles(true);
}

function downloadCheckedFiles() {
  const files = [...checkedIds.value].reduce((acc, id) => {
    const file = fileLists.value.find((v) => v.id === id);
    if (file.file_data) {
      acc.push(file); // => 파일들을 하나하나 분해해서 acc에 추가
    }
    return acc;
  }, []);

  downloadAllFiles(files);

  checkedIds.value.clear(); // 다운로드 후 체크박스 초기화
  lastCheckedIndex.value = null; // 기준점 초기화
}
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
function downloadAllFiles(files, id = '') {
  const zip = new JSZip();

  files.forEach((file) => {
    const binary = atob(file.file_data);
    const byteArray = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
    zip.file(file.file_name || `file-${Date.now()}.pdf`, byteArray);
  });

  zip.generateAsync({ type: 'blob' }).then((content) => {
    const filename = id ? `${id}.zip` : '첨부파일.zip';
    saveAs(content, filename);
  });
}

// 메모리 누수 방지용 URL 저장소
const objectUrls = new Map();

// 컴포넌트가 사라질 때 URL 정리
onUnmounted(() => {
  for (const url of objectUrls.values()) {
    URL.revokeObjectURL(url);
  }
});

watch(selectedCompany, async (newCompany) => {
  selectedGroup.value = '';
  fileLists.value = [];
  if (newCompany) {
    await loadGroupOptions(newCompany);
  }
});

watch([selectedCompany, selectedDate, lockFilter, selectedGroup], async () => {
  if (selectedGroup.value) {
    await fetchFiles(true);
  }
});
</script>

<template>
  <div class="bg-testPink flex h-full w-full flex-col p-8">
    <div class="grid grid-cols-2">
      <div class="col-span-1 flex gap-1">
        <!-- 회사 선택 -->
        <div class="max-w-30">
          <Dropdown
            @select="(select) => (selectedCompany = select)"
            :options="companyOptions"
            :nameToEnum="companyNameToEnum"
          />
        </div>

        <!-- 그룹 선택 -->
        <div class="max-w-40" v-show="selectedCompany">
          <Dropdown
            v-model="selectedGroup"
            @select="(select) => (selectedGroup = select)"
            :options="groupOptions"
            :nameToEnum="groupNameToEnum"
            :isGroupDropdown="true"
            :company="selectedCompany"
            @group-created="() => loadGroupOptions(selectedCompany)"
          />
        </div>

        <!-- 삭제 버튼 -->
        <div
          class="flex h-9 max-w-35 items-center justify-center rounded-sm border border-gray-300 text-sm font-semibold hover:bg-red-500 hover:text-white"
          v-show="hasChecked"
        >
          <input
            class="h-full w-10 cursor-pointer rounded-sm"
            type="button"
            value="삭제"
            @click="deleteFiles"
          />
        </div>
      </div>

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
              nextTick(() => {
                search();
              });
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
      class="flex flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50"
    >
      <!-- 고정 헤더 테이블 -->
      <div class="flex min-w-[1300px] flex-1 flex-col overflow-y-hidden">
        <div class="block h-10 w-full">
          <table class="h-10 w-full min-w-[1300px] table-fixed">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="w-[2%] px-4 py-2 text-left">
                  <input type="checkbox" id="check-all" />
                </th>
                <th class="w-[8%] px-4 py-2 text-left">날짜</th>
                <th class="w-[60%] truncate px-4 py-2 text-left">설명</th>
                <th class="w-[25%] px-4 py-2 text-left">
                  <div class="flex justify-between">
                    <div class="flex items-center justify-center">첨부파일</div>
                    <div
                      class="ml-2 flex h-6 w-20 items-center justify-center rounded-sm border border-gray-300 text-sm font-semibold hover:bg-blue-500 hover:text-white"
                      v-show="hasChecked"
                    >
                      <input
                        class="h-full w-full cursor-pointer content-center rounded-sm text-sm"
                        type="button"
                        value="일괄 저장"
                        @click="downloadCheckedFiles"
                      />
                    </div>
                    <div>
                      <input id="lock-filter" v-show="false" type="checkbox" v-model="lockFilter" />
                      <label
                        v-if="roles.includes('ADMIN') && selectedCompany"
                        for="lock-filter"
                        class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-gray-300 hover:bg-gray-200"
                      >
                        <svg
                          v-if="lockFilter"
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
                  </div>
                </th>
                <th class="w-[5%] px-4 py-2 text-left"></th>
              </tr>
            </thead>
          </table>
        </div>

        <UserInput
          v-show="selectedGroup"
          :selectedCompany="selectedCompany"
          @createFiles="addCreatedFiles"
          :selectedGroupId="selectedGroup"
        />

        <div class="no-scrollbar min-h-0 flex-1 overflow-y-scroll">
          <table class="w-full min-w-[1300px] table-fixed">
            <tbody>
              <!-- 반복 행 예시 -->
              <tr
                v-for="(file, index) in fileLists"
                :key="file.id"
                class="files w-full border-b border-gray-200 dark:border-gray-700"
              >
                <td class="w-[2%] px-4 py-2">
                  <input
                    type="checkbox"
                    class="row-check"
                    :checked="checkedIds.has(file.id)"
                    @click="handleCheckboxClick($event, index)"
                  />
                </td>
                <td class="w-[8%] px-4 py-2">
                  {{ formatDate(file.withdrawn_at) }}
                </td>
                <td class="flex w-[60%] truncate px-4 py-2">
                  {{ file.name }}
                  <svg
                    v-if="file.lock"
                    xmlns="http://www.w3.org/2000/svg"
                    class="ml-1 h-4 w-4 text-gray-800"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-3 0H9V9a3 3 0 1 1 6 0v2z"
                    />
                  </svg>
                </td>
                <td
                  class="group relative w-[25%] px-4 py-2 text-ellipsis whitespace-nowrap"
                  @mouseenter="handlePreviewPosition"
                  @mouseleave="resetPreviewPosition"
                >
                  <div class="group relative inline-block w-full">
                    <div class="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      <a
                        :href="`data:application/pdf;base64,${file.file_data}`"
                        :download="file.file_name"
                        class="text-blue-500 hover:text-blue-600"
                      >
                        {{ file.file_name }}
                      </a>
                    </div>
                    <div
                      class="pdf-preview absolute top-full left-0 z-20 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
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
                <td class="mr-2 h-full w-[5%] py-2 text-base">
                  <input
                    type="button"
                    value="수정"
                    @click="openEditModal(file)"
                    class="h-6 w-14 cursor-pointer rounded-sm border border-gray-300 bg-white pr-1.5 pl-1.5 text-sm hover:bg-black hover:text-white"
                  />
                </td>
              </tr>
              <Sentinel v-if="currentPage < totalPage" :onIntersect="handleIntersect" />
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <EditModal
      :visible="isEditModalOpen"
      :file="editTargetFile"
      @close="closeEditModal"
      @save="editFile"
    />
  </div>
</template>

<style scoped></style>
