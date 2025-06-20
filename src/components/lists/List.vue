<script setup>
import { ref, watch, onUnmounted, computed, onMounted, nextTick } from 'vue';
import Dropdown from './Dropdown.vue';
import { authFetch } from '../../utils/authFetch';
import Sentinel from './Sentinel.vue';
import DateSearch from './DateSearch.vue';
import EditModal from './EditModal.vue';
import { useTypeStore } from '@/stores/typeStore';
import { getRoleFromLocalStorage } from '@/utils/token';
import { connectSyncStatusSocket, disconnectSyncStatusSocket } from '@/utils/syncStatus';
import { useSyncStatusStore } from '@/stores/syncStatusStore';
const syncStore = useSyncStatusStore();

onMounted(() => {
  connectSyncStatusSocket();
});

const role = ref(getRoleFromLocalStorage());

const typeStore = useTypeStore();

const previewUrlCache = new Map();
const worker = new Worker(new URL('./pdf-worker.js', import.meta.url), {
  type: 'module',
});

worker.onmessage = (e) => {
  const { id, merged_pdf_url } = e.data;
  previewUrlCache.set(id, merged_pdf_url);
  const voucher = voucherLists.value.find((v) => v.id === id);
  if (voucher) {
    voucher.merged_pdf_url = merged_pdf_url;
  }
};

const isLoading = ref(false);
const selectedCompany = ref(null);
const selectedDate = ref('');
const voucherLists = ref([]);
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
  const voucher = voucherLists.value[index];
  const id = voucher.id;

  if (event.shiftKey && lastCheckedIndex.value !== null) {
    const start = Math.min(lastCheckedIndex.value, index);
    const end = Math.max(lastCheckedIndex.value, index);

    const rangeVouchers = voucherLists.value.slice(start, end + 1);

    const clickedWasChecked = checkedIds.value.has(id);

    rangeVouchers.forEach((v) => {
      if (clickedWasChecked) {
        checkedIds.value.delete(v.id); // 전체 해제
      } else {
        checkedIds.value.add(v.id); // 전체 체크
      }
    });
    checkedIds.value = new Set(checkedIds.value); // 반응 유도

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

import Searchbar from './Searchbar.vue';
import { useToast } from 'vue-toastification';

const voucherUrl = `${import.meta.env.VITE_VOUCHER_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const editTargetVoucher = ref(null);
const lockFilter = ref(false);

function openEditModal(voucher) {
  editTargetVoucher.value = voucher;
  isEditModalOpen.value = true;
}

function closeEditModal() {
  isEditModalOpen.value = false;
  editTargetVoucher.value = null;
}

function openWhgLoginModal() {
  isLoginModalOpen.value = true;
}

function closeWhgLoginModal() {
  isLoginModalOpen.value = false;
}

async function fetchVouchers(isReset = false) {
  if (!selectedCompany.value || selectedCompany.value === '') return;
  if (isReset) {
    voucherLists.value = [];
    totalPage.value = 0;
    currentPage.value = 1;
  }

  const params = new URLSearchParams();
  params.append('company', selectedCompany.value);
  params.append('start_at', start_at.value ? start_at.value : '');
  params.append('end_at', end_at.value ? end_at.value : '');
  params.append('page', currentPage.value);
  params.append('search', searchbar.value);
  params.append('search_option', searchbarOption.value);

  isLoading.value = true;
  isPdfConverting.value = true;
  try {
    const response = await authFetch(voucherUrl + '?' + params.toString());
    const [total_count, total_page, lists] = await response.json();

    totalPage.value = total_page;
    const vouchers = lists.map((voucher) => ({
      ...voucher,
      pdf_url: null, // 나중에 Worker가 채워줌
    }));
    voucherLists.value = [...voucherLists.value, ...vouchers];

    vouchers.forEach((voucher) => {
      if (!previewUrlCache.has(voucher.id)) {
        const files = voucher.files || [];
        worker.postMessage({
          id: voucher.id,
          files: files.map(({ file_data }) => ({ file_data })),
        });
      } else {
        voucher.merged_pdf_url = previewUrlCache.get(voucher.id);
      }
    });
  } finally {
    isLoading.value = false;
    isPdfConverting.value = false;
  }
}

const isSyncing = computed(() => syncStore.syncing);

async function syncWhg(payload) {
  if (isSyncing.value) return;

  try {
    syncStore.setSyncing(true); // 로컬에서도 UX적으로 미리 처리
    const response = await authFetch(`${voucherUrl}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company: selectedCompany.value,
        wehago_id: payload.whgId,
        wehago_password: payload.whgPassword,
        year: payload.selectedYear,
      }),
    });

    if (response.ok) {
      toast.success('파일 동기화 성공');
      fetchVouchers(true);
    } else if (response.status === 460) {
      toast.error('로그인 정보가 올바르지 않습니다. 다시 시도해주세요.');
    } else {
      toast.error('파일 동기화 실패');
    }
  } catch (error) {
    toast.error('파일 동기화 실패');
    console.error(error);
  }
}

// 전표 삭제는 안할거기 때문에 주석처리리
// async function deleteFiles() {
//   const query = [...checkedIds.value].map((id) => `ids=${id}`).join('&');

//   try {
//     const response = await authFetch(`${voucherUrl}?${query}`, {
//       method: 'DELETE',
//     });

//     if (response.ok) {
//       toast.success('파일 삭제 성공');
//       checkedIds.value.clear();
//       fetchVouchers(true);
//     } else {
//       toast.error('파일 삭제 실패');
//     }
//   } catch (error) {
//     toast.error('파일 삭제 실패');
//     console.error(error);
//   }
// }

async function editVoucher(payload) {
  const formData = new FormData();

  // ✅ 새로 업로드할 파일들
  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
  }

  // ✅ 삭제할 파일 ID 목록
  if (payload.deleteTargets && payload.deleteTargets.length > 0) {
    payload.deleteTargets.forEach((fileId) => {
      formData.append('file_ids', fileId);
    });
  }

  try {
    const response = await authFetch(`${voucherUrl}/${payload.id}`, {
      method: 'PATCH',
      body: formData,
    });

    if (response.ok) {
      toast.success('수정 완료');
      // ✅ 기존 PDF URL 캐시 제거 (다시 생성되도록 유도)
      previewUrlCache.delete(payload.id);
      closeEditModal();
      fetchVouchers(true);
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
    fetchVouchers();
  }
}

function search() {
  fetchVouchers(true);
}

// 메모리 누수 방지용 URL 저장소
const objectUrls = new Map();

// 컴포넌트가 사라질 때 URL 정리
onUnmounted(() => {
  for (const url of objectUrls.values()) {
    URL.revokeObjectURL(url);
  }
  disconnectSyncStatusSocket();
});

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import WhgLoginModal from '@/components/lists/WhgLoginModal.vue';

function downloadCheckedFiles() {
  const files = [...checkedIds.value].reduce((acc, id) => {
    const voucher = voucherLists.value.find((v) => v.id === id);
    if (voucher?.files?.length) {
      acc.push(...voucher.files); // => 파일들을 하나하나 분해해서 acc에 추가
    }
    return acc;
  }, []);

  downloadAllFiles(files);

  checkedIds.value.clear(); // 다운로드 후 체크박스 초기화
  lastCheckedIndex.value = null; // 기준점 초기화
}

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

watch([selectedCompany, start_at, end_at, lockFilter], async () => {
  await fetchVouchers(true);
});
</script>

<template>
  <div class="bg-testPink flex h-full w-full flex-col p-8">
    <div class="grid grid-cols-2">
      <div class="col-span-1 flex">
        <Dropdown
          class="col-span-1"
          @select="(select) => (selectedCompany = select)"
          :options="companyOptions"
          :nameToEnum="companyNameToEnum"
        />
        <div
          v-show="selectedCompany"
          :class="[
            'mb-2 ml-2 flex w-18 items-center justify-center rounded-xl border border-gray-300 font-semibold transition-colors',
            isSyncing
              ? 'cursor-not-allowed bg-gray-200 text-gray-500'
              : 'cursor-pointer hover:bg-blue-500 hover:text-white',
          ]"
        >
          <!-- 버튼 안쪽은 그대로 유지 -->
          <button
            :class="[
              'flex w-full items-center justify-center rounded-xl px-2 py-1 font-semibold transition-colors',
              isSyncing
                ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                : 'cursor-pointer hover:bg-blue-500 hover:text-white',
            ]"
            @click="openWhgLoginModal"
            :disabled="isSyncing"
          >
            <template v-if="isSyncing">
              <svg
                class="mx-auto h-4 w-4 animate-spin text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </template>
            <template v-else>동기화</template>
          </button>
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
        <!-- <div
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
        </div> -->
      </div>
    </div>
    <div
      class="flex flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50"
    >
      <!-- 고정 헤더 테이블 -->
      <div class="flex min-w-[1300px] flex-1 flex-col overflow-y-hidden">
        <div class="block h-14">
          <table class="h-full w-full min-w-[1300px] table-fixed">
            <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="w-[2%] px-4 py-2 text-left">
                  <input type="checkbox" id="check-all" />
                </th>
                <th class="w-[9%] px-4 py-2 text-left">날짜</th>
                <th class="w-[9%] truncate px-4 py-2 text-left">계정과목</th>
                <th class="w-[10%] truncate px-4 py-2 text-left">거래처</th>
                <th class="w-[9%] truncate px-4 py-2 text-right">차변금액</th>
                <th class="w-[9%] px-4 py-2 text-right">대변금액</th>
                <th class="w-[17%] px-4 py-2 text-left">적요</th>
                <th class="w-[30%] px-4 py-2 text-left">
                  <div class="flex">
                    <div class="flex items-center justify-center"><p>첨부파일</p></div>
                    <div
                      class="ml-2 flex h-7 w-20 items-center justify-center rounded-sm border border-gray-300 text-sm font-semibold hover:bg-blue-500 hover:text-white"
                      v-show="hasChecked"
                    >
                      <input
                        class="h-full w-full cursor-pointer content-center rounded-sm text-sm"
                        type="button"
                        value="일괄 저장"
                        @click="downloadCheckedFiles"
                      />
                    </div>
                    <!-- <div>
                    <input id="lock-filter" v-show="false" type="checkbox" v-model="lockFilter" />
                    <label
                      v-show="role === 'ADMIN' && selectedCompany"
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
                  </div> -->
                  </div>
                </th>
                <th class="w-[5%] px-4 py-2 text-left"></th>
              </tr>
            </thead>
          </table>
        </div>

        <div class="no-scrollbar min-h-0 flex-1 overflow-y-scroll">
          <table class="w-full min-w-[1300px] table-fixed">
            <tbody>
              <!-- 반복 행 예시 -->
              <tr
                v-for="(voucher, index) in voucherLists"
                :key="voucher.id"
                class="files border-b border-gray-200 dark:border-gray-700"
              >
                <td class="w-[2%] px-4 py-2">
                  <input
                    type="checkbox"
                    class="row-check"
                    :checked="checkedIds.has(voucher.id)"
                    @click="handleCheckboxClick($event, index)"
                  />
                </td>
                <td class="w-[9%] px-4 py-2">
                  {{ formatDate(voucher.voucher_date) }}
                </td>
                <td class="w-[9%] truncate px-4 py-2">
                  {{ voucher.nm_acctit }}
                  <!-- <svg
                  v-if="voucher.lock"
                  xmlns="http://www.w3.org/2000/svg"
                  class="ml-1 h-4 w-4 text-gray-800"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-3 0H9V9a3 3 0 1 1 6 0v2z"
                  />
                </svg> -->
                </td>
                <td class="w-[10%] px-4 py-2">{{ voucher.nm_trade }}</td>
                <td class="w-[9%] px-4 py-2 text-right">
                  {{ voucher.mn_bungae1 == 0 ? '' : formatPrice(voucher.mn_bungae1) }}
                </td>
                <td class="w-[9%] px-4 py-2 text-right">
                  {{ voucher.mn_bungae2 == 0 ? '' : formatPrice(voucher.mn_bungae2) }}
                </td>
                <td class="w-[17%] px-4 py-2">{{ voucher.nm_remark }}</td>
                <td
                  class="group relative w-[30%] px-4 py-2"
                  @mouseenter="handlePreviewPosition"
                  @mouseleave="resetPreviewPosition"
                >
                  <div class="group relative inline-block w-full">
                    <!-- 파일 이름 리스트 -->
                    <div class="overflow-hidden text-ellipsis whitespace-nowrap">
                      <template v-if="voucher.files && voucher.files.length">
                        <a
                          href="#"
                          @click.prevent="downloadAllFiles(voucher.files, voucher.nm_remark)"
                          class="block text-blue-500 hover:text-blue-600"
                          :title="
                            voucher.files.length === 1
                              ? voucher.files[0].file_name
                              : `${voucher.files[0].file_name} 외 ${voucher.files.length - 1}건`
                          "
                        >
                          {{
                            voucher.files.length === 1
                              ? voucher.files[0].file_name
                              : `${voucher.files[0].file_name} 외 ${voucher.files.length - 1}건`
                          }}
                        </a>
                      </template>
                    </div>

                    <!-- 하나의 병합된 PDF 미리보기 -->
                    <div
                      v-if="voucher.files && voucher.merged_pdf_url"
                      class="pdf-preview absolute top-full left-0 z-10 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
                    >
                      <embed
                        :src="voucher.merged_pdf_url"
                        type="application/pdf"
                        class="h-full w-full"
                      />
                    </div>
                  </div>
                </td>
                <td class="mr-2 h-full w-[5%] py-2 text-base">
                  <input
                    type="button"
                    value="첨부"
                    @click="openEditModal(voucher)"
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
      :voucher="editTargetVoucher"
      @close="closeEditModal"
      @save="editVoucher"
    />
    <WhgLoginModal
      :visible="isLoginModalOpen"
      :company="selectedCompany"
      @close="closeWhgLoginModal"
      @save="syncWhg"
    />
  </div>
</template>

<style scoped></style>
