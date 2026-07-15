<script setup>
import { ref, watch, onUnmounted, computed, onMounted, nextTick, shallowRef } from 'vue';
import Dropdown from './Dropdown.vue';
import { authFetch } from '../../utils/authFetch';
import DateSearch from './DateSearch.vue';
import EditModal from './EditModal.vue';
import { useTypeStore } from '@/stores/useTypeStore';
import { getRoleFromLocalStorage } from '@/utils/token';
import { connectSyncStatusSocket, disconnectSyncStatusSocket } from '@/utils/syncStatus';
import { useSyncStatusStore } from '@/stores/useSyncStatusStore';
import BaseList from '@/components/base/BaseList.vue';
import Searchbar from './Searchbar.vue';
import { useToast } from 'vue-toastification';
import { useFileDownloader } from '@/composables/useFileDownloader';
import { downloadVoucherFiles } from '@/api/voucher';
import WhgLoginModal from '@/components/lists/WhgLoginModal.vue';
import { companyNameToEnum, companyOptions } from '@/constants/companies';
import VoucherAttachmentCell from '@/components/lists/VoucherAttachmentCell.vue';
import { useRoute, useRouter } from 'vue-router';

const syncStore = useSyncStatusStore();
const route = useRoute();
const router = useRouter();

function getQueryValue(key) {
  const value = route.query[key];
  return typeof value === 'string' ? value : '';
}

onMounted(() => {
  connectSyncStatusSocket();
  if (selectedCompany.value) {
    fetchVouchers(true);
  }
});

const role = ref(getRoleFromLocalStorage());
const typeStore = useTypeStore();
const companyLabelByValue = Object.fromEntries(
  Object.entries(companyNameToEnum).map(([label, value]) => [value, label]),
);

const isLoading = ref(false);
const selectedCompany = ref(getQueryValue('company'));
const selectedDate = ref('');
const voucherLists = shallowRef([]);
const totalCount = ref(0);
const totalPage = ref(0);
const currentPage = ref(1);
const isPdfConverting = ref(false);
const start_at = ref(getQueryValue('start_at'));
const end_at = ref(getQueryValue('end_at'));

const searchbar = ref(getQueryValue('search'));
const searchbarOption = ref(getQueryValue('search_option'));

const voucherSearchFieldByOption = {
  NM_ACCTIT: 'nm_acctit',
  NM_TRADE: 'nm_trade',
  NM_REMARK: 'nm_remark',
};

const hasActiveSearch = computed(() => Boolean(searchbar.value.trim() && searchbarOption.value));

function normalizeSearchValue(value) {
  return String(value ?? '').toLocaleLowerCase();
}

const highlightedVouchers = computed(() => {
  const searchField = voucherSearchFieldByOption[searchbarOption.value];
  const searchTerm = normalizeSearchValue(searchbar.value.trim());

  return voucherLists.value.map((voucher) => ({
    ...voucher,
    isSearchMatch: Boolean(
      searchField && searchTerm && normalizeSearchValue(voucher[searchField]).includes(searchTerm),
    ),
  }));
});

const searchResultSummary = computed(() => {
  if (!hasActiveSearch.value) return null;

  const matchedCount = highlightedVouchers.value.filter((voucher) => voucher.isSearchMatch).length;
  return {
    matchedCount,
    relatedCount: highlightedVouchers.value.length - matchedCount,
  };
});

function getVoucherRowClass(voucher) {
  return voucher.isSearchMatch ? '!bg-amber-50 dark:!bg-amber-950/40' : '';
}

const checkedIds = ref(new Set());
const uploadingVoucherIds = ref(new Set());
const hasChecked = computed(() => checkedIds.value.size > 0);
const acceptedVoucherFilePattern = /\.(pdf|jpe?g|png)$/i;

const voucherUrl = `${import.meta.env.VITE_VOUCHER_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const editTargetVoucher = ref(null);
const lockFilter = ref(false);
const loadError = ref('');
let activeRequestController = null;
let requestSequence = 0;

const headers = ref([
  { text: '날짜', value: 'voucher_date', width: '9%' },
  { text: '계정과목', value: 'nm_acctit', width: '9%' },
  { text: '거래처', value: 'nm_trade', width: '10%' },
  { text: '차변금액', value: 'mn_bungae1', width: '9%', align: 'right' },
  { text: '대변금액', value: 'mn_bungae2', width: '9%', align: 'right' },
  { text: '적요', value: 'nm_remark', width: '17%' },
  { text: '첨부파일', value: 'files', width: '30%' },
  { text: '', value: 'actions', width: '5%' },
]);

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

  activeRequestController?.abort();
  const requestController = new AbortController();
  activeRequestController = requestController;
  const requestId = ++requestSequence;

  if (isReset) {
    voucherLists.value = [];
    totalCount.value = 0;
    totalPage.value = 0;
    currentPage.value = 1;
  }

  loadError.value = '';

  const params = new URLSearchParams();
  params.append('company', selectedCompany.value);
  params.append('start_at', start_at.value ? start_at.value : '');
  params.append('end_at', end_at.value ? end_at.value : '');
  params.append('page', currentPage.value);
  params.append('items_per_page', '30'); // 임시로 50개로 테스트
  params.append('search', searchbar.value);
  params.append('search_option', searchbarOption.value);

  isLoading.value = true;
  isPdfConverting.value = true;
  try {
    const response = await authFetch(voucherUrl + '?' + params.toString(), {
      signal: requestController.signal,
    });
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, '전표를 불러오지 못했습니다.'));
    }
    const [total_count, total_page, lists] = await response.json();

    if (requestId !== requestSequence) return;

    totalPage.value = total_page;
    totalCount.value = total_count;
    const vouchers = lists.map((voucher) => ({
      ...voucher,
    }));
    voucherLists.value = [...voucherLists.value, ...vouchers];
  } catch (error) {
    if (error.name === 'AbortError' || requestId !== requestSequence) return;

    loadError.value = error.message || '전표를 불러오는 중 오류가 발생했습니다.';
  } finally {
    if (requestId === requestSequence) {
      isLoading.value = false;
      isPdfConverting.value = false;
    }
  }
}

// 기존 복잡한 로직 제거 - 백엔드에서 한 번에 처리

const isSyncing = computed(() => syncStore.syncing);

async function getErrorMessage(response, fallbackMessage) {
  if (response.status === 460) {
    return 'WEHAGO 아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.';
  }

  const errorBody = await response.json().catch(() => null);

  if (typeof errorBody?.detail === 'string' && errorBody.detail) {
    return errorBody.detail;
  }

  return `${fallbackMessage} (HTTP ${response.status})`;
}

async function syncWhg(payload) {
  if (isSyncing.value) return;

  try {
    syncStore.setSyncing(true);
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
    } else {
      toast.error(await getErrorMessage(response, '동기화에 실패했습니다.'));
    }
  } catch (error) {
    toast.error('동기화 요청 중 네트워크 오류가 발생했습니다. 연결 상태를 확인해주세요.');
    console.error(error);
  }
}

async function editVoucher(payload) {
  const formData = new FormData();

  if (payload.files && payload.files.length > 0) {
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
  }

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

function setVoucherUploading(voucherId, isUploading) {
  const nextUploadingIds = new Set(uploadingVoucherIds.value);

  if (isUploading) {
    nextUploadingIds.add(voucherId);
  } else {
    nextUploadingIds.delete(voucherId);
  }

  uploadingVoucherIds.value = nextUploadingIds;
}

function replaceVoucher(updatedVoucher) {
  voucherLists.value = voucherLists.value.map((voucher) =>
    voucher.id === updatedVoucher.id ? updatedVoucher : voucher,
  );
}

async function addVoucherFiles(voucher, files) {
  if (!files.length || uploadingVoucherIds.value.has(voucher.id)) return;

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  setVoucherUploading(voucher.id, true);

  try {
    const response = await authFetch(`${voucherUrl}/${voucher.id}`, {
      method: 'PATCH',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, '첨부파일 추가에 실패했습니다.'));
    }

    replaceVoucher(await response.json());
    toast.success(`${files.length}개 파일을 첨부했습니다.`);
  } catch (error) {
    toast.error(error.message || '첨부파일 추가에 실패했습니다.');
    console.error(error);
  } finally {
    setVoucherUploading(voucher.id, false);
  }
}

function handleVoucherFiles(voucher, files) {
  const invalidFiles = files.filter((file) => !acceptedVoucherFilePattern.test(file.name));
  if (invalidFiles.length) {
    toast.error('PDF, JPG, PNG 파일만 첨부할 수 있습니다.');
    return;
  }

  addVoucherFiles(voucher, files);
}

function formatDate(dateStr) {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}/${month}/${day}`;
}

function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function handleIntersect() {
  if (currentPage.value < totalPage.value && !isLoading.value && !isPdfConverting.value) {
    currentPage.value++;
    fetchVouchers();
  }
}

function search() {
  fetchVouchers(true);
}

onUnmounted(() => {
  activeRequestController?.abort();
  if (debounceTimer) clearTimeout(debounceTimer);
  disconnectSyncStatusSocket();
});

const { downloadAllFiles } = useFileDownloader();
const downloadVoucherAttachments = (files, id) => downloadAllFiles(files, id, downloadVoucherFiles);

function getBadgeClassByCode(code) {
  if (!code) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
  const codeStr = code.toString();
  if (codeStr.startsWith('103')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'; // 103 코드
  }

  const firstDigit = codeStr[0];
  const colorMap = {
    '1': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    '2': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    '3': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    '4': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    '5': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', // 차량
    '6': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    '8': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', // 사무실
  };
  return (
    colorMap[firstDigit] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  );
}

// 그룹 자동 로딩 함수 제거

// 디바운스된 fetch 함수 생성
let debounceTimer = null;
const debouncedFetchVouchers = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchVouchers(true);
  }, 300);
};

watch([selectedCompany, start_at, end_at, lockFilter], debouncedFetchVouchers);

watch([selectedCompany, start_at, end_at, searchbar, searchbarOption], () => {
  const query = {
    company: selectedCompany.value || undefined,
    start_at: start_at.value || undefined,
    end_at: end_at.value || undefined,
    search: searchbar.value || undefined,
    search_option: searchbarOption.value || undefined,
  };

  router.replace({ query }).catch(() => {});
});
</script>

<template>
  <div class="bg-testPink flex h-full w-full flex-col p-8">
    <div class="flex flex-col gap-2 min-[760px]:flex-row min-[760px]:items-start">
      <div class="flex shrink-0">
          <Dropdown
            @select="(select) => (selectedCompany = select)"
            :options="companyOptions"
            :nameToEnum="companyNameToEnum"
            :selectedLabel="companyLabelByValue[selectedCompany]"
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
      <div class="flex min-w-0 flex-col gap-2 min-[560px]:flex-row min-[760px]:ml-auto min-[760px]:self-start">
        <DateSearch
          class="shrink-0"
          :startAt="start_at"
          :endAt="end_at"
          @search="
            ({ start_at: s, end_at: e }) => {
              start_at = s;
              end_at = e;
            }
          "
        />
        <Searchbar
          class="min-w-0 min-[560px]:ml-1 min-[560px]:min-w-[16rem]"
          :searchValue="searchbar"
          :searchOption="searchbarOption"
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
      </div>
    </div>

    <div
      v-if="selectedCompany"
      class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
    >
      <span class="font-semibold">전체 {{ totalCount }}건</span>
      <span>현재 {{ highlightedVouchers.length }}건 표시</span>
      <span v-if="isLoading">추가 결과를 불러오는 중입니다.</span>
      <template v-if="searchResultSummary">
        <span class="text-amber-800 dark:text-amber-200">직접 일치 {{ searchResultSummary.matchedCount }}건</span>
        <span v-if="searchResultSummary.relatedCount" class="text-slate-600 dark:text-slate-300">같은 전표 묶음 {{ searchResultSummary.relatedCount }}건</span>
        <span class="text-amber-700 dark:text-amber-300">노란색 행은 검색어와 직접 일치합니다.</span>
      </template>
    </div>

    <BaseList
      :headers="headers"
      :items="highlightedVouchers"
      :loading="isLoading || isPdfConverting"
      :checkedIds="checkedIds"
      @update:checkedIds="checkedIds = $event"
      :currentPage="currentPage"
      :totalPage="totalPage"
      :rowDropEnabled="true"
      :rowClass="getVoucherRowClass"
      :errorMessage="loadError"
      @intersect="handleIntersect"
      @row-drop="({ item, files }) => handleVoucherFiles(item, files)"
      @retry="search"
    >
      <template #header.files="{ header }">
        <div class="flex">
          <div class="flex items-center justify-center">
            <p>{{ header.text }}</p>
          </div>
        </div>
      </template>

      <template #item.voucher_date="{ item }">
        <div class="text-center">{{ formatDate(item.voucher_date) }}</div>
      </template>

      <template #item.nm_acctit="{ item }">
        <div class="flex items-center justify-center">
          <span
            :class="[
              'rounded-full px-2.5 py-1 text-sm font-semibold',
              getBadgeClassByCode(item.cd_acctit),
            ]"
          >
            {{ item.nm_acctit }}
          </span>
        </div>
      </template>

      <template #item.nm_trade="{ item }">
        <div
          class="truncate whitespace-nowrap"
          :title="item.nm_trade"
        >
          {{ item.nm_trade }}
        </div>
      </template>

      <template #item.mn_bungae1="{ item }">
        {{ item.mn_bungae1 == 0 ? '' : formatPrice(item.mn_bungae1) }}
      </template>

      <template #item.mn_bungae2="{ item }">
        {{ item.mn_bungae2 == 0 ? '' : formatPrice(item.mn_bungae2) }}
      </template>

      <template #item.nm_remark="{ item }">
        <div
          class="truncate whitespace-nowrap"
          :title="item.nm_remark"
        >
          {{ item.nm_remark }}
        </div>
      </template>

      <template #item.files="{ item, isDropTarget }">
        <VoucherAttachmentCell
          :voucher-id="item.id"
          :files="item.files || []"
          :uploading="uploadingVoucherIds.has(item.id)"
          :dropActive="isDropTarget"
          @download="downloadVoucherAttachments(item.files, item.nm_remark)"
          @upload="(files) => handleVoucherFiles(item, files)"
        />
      </template>

      <template #item.actions="{ item }">
        <div class="flex flex-col items-center gap-1">
          <span
            v-if="hasActiveSearch"
            :class="[
              'whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold',
              item.isSearchMatch
                ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-50'
                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
            ]"
          >
            {{ item.isSearchMatch ? '검색 일치' : '같은 전표' }}
          </span>
          <button
            type="button"
            @click="openEditModal(item)"
            class="h-6 w-14 cursor-pointer rounded-sm border border-gray-300 bg-white px-1.5 text-sm hover:bg-black hover:text-white dark:bg-gray-800"
          >
            관리
          </button>
        </div>
      </template>
    </BaseList>

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

    <!-- Floating Action Bar -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-full opacity-0"
    >
      <div
        v-if="hasChecked"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full bg-gray-900 px-6 py-3 text-white shadow-xl"
      >
        <span class="text-sm font-medium">{{ checkedIds.size }}개 항목 선택됨</span>
        <div class="h-4 w-px bg-gray-600"></div>
        <button
          class="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-blue-500"
          @click="
            () => {
              const files = Array.from(checkedIds || []).reduce((acc, id) => {
                const voucher = voucherLists.find((v) => v.id === id);
                if (voucher?.files?.length) {
                  acc.push(...voucher.files);
                }
                return acc;
              }, []);
              downloadVoucherAttachments(files);
              if (checkedIds && checkedIds.clear) {
                checkedIds.clear();
              }
            }
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          일괄 저장
        </button>
        <button
          class="ml-2 text-gray-400 transition-colors hover:text-white"
          @click="checkedIds.clear()"
          title="선택 취소"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped></style>
