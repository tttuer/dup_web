<script setup>
import { ref, watch, onUnmounted, computed, onMounted, nextTick } from 'vue';
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
import { usePdfPreview } from '@/composables/usePdfPreview';
import WhgLoginModal from '@/components/lists/WhgLoginModal.vue';

const syncStore = useSyncStatusStore();

onMounted(() => {
  connectSyncStatusSocket();
});

const role = ref(getRoleFromLocalStorage());
const typeStore = useTypeStore();

const isLoading = ref(false);
const selectedCompany = ref(null);
const selectedDate = ref('');
const voucherLists = ref([]);
const totalPage = ref(0);
const currentPage = ref(1);
const isPdfConverting = ref(false);
const start_at = ref('');
const end_at = ref('');
const { handlePreviewPosition, resetPreviewPosition, generatePreview, clearPreviewCache } =
  usePdfPreview(voucherLists, 'merge');
const companyOptions = ['백성운수', '평택여객', '파란전기'];
const companyNameToEnum = {
  백성운수: 'BAEKSUNG',
  평택여객: 'PYEONGTAEK',
  파란전기: 'PARAN',
};
const searchbar = ref('');
const searchbarOption = ref('');
const checkedIds = ref(new Set());
const hasChecked = computed(() => checkedIds.value.size > 0);

const voucherUrl = `${import.meta.env.VITE_VOUCHER_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const editTargetVoucher = ref(null);
const lockFilter = ref(false);

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
      generatePreview(voucher);
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
      clearPreviewCache(payload.id);
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
  currentPage.value++;
  fetchVouchers();
}

function search() {
  fetchVouchers(true);
}

onUnmounted(() => {
  disconnectSyncStatusSocket();
});

const { downloadAllFiles } = useFileDownloader();

watch([selectedCompany, start_at, end_at, lockFilter], async () => {
  await fetchVouchers(true);
});

watch(voucherLists, () => {
  nextTick(() => {
    const container = document.querySelector('.overflow-y-scroll');

    if (
      container &&
      container.scrollHeight <= container.clientHeight &&
      currentPage.value < totalPage.value &&
      !isLoading.value &&
      !isPdfConverting.value
    ) {
      currentPage.value++;
      fetchVouchers();
    }
  });
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
      </div>
    </div>

    <BaseList
      :headers="headers"
      :items="voucherLists"
      :loading="isLoading || isPdfConverting"
      :checkedIds="checkedIds"
      @update:checkedIds="checkedIds = $event"
      :currentPage="currentPage"
      :totalPage="totalPage"
      @intersect="handleIntersect"
    >
      <template #header.files="{ header }">
        <div class="flex">
          <div class="flex items-center justify-center">
            <p>{{ header.text }}</p>
          </div>
          <div
            class="ml-2 flex h-7 w-20 items-center justify-center rounded-sm border border-gray-300 text-sm font-semibold hover:bg-blue-500 hover:text-white"
            v-show="hasChecked"
          >
            <input
              class="h-full w-full cursor-pointer content-center rounded-sm text-sm"
              type="button"
              value="일괄 저장"
              @click="
                () => {
                  const files = Array.from(checkedIds || []).reduce((acc, id) => {
                    const voucher = voucherLists.find((v) => v.id === id);
                    if (voucher?.files?.length) {
                      acc.push(...voucher.files);
                    }
                    return acc;
                  }, []);
                  downloadAllFiles(files);
                  if (checkedIds && checkedIds.clear) {
                    checkedIds.clear();
                  }
                }
              "
            />
          </div>
        </div>
      </template>

      <template #item.voucher_date="{ item }">
        {{ formatDate(item.voucher_date) }}
      </template>

      <template #item.nm_acctit="{ item }">
        {{ item.nm_acctit }}
      </template>

      <template #item.mn_bungae1="{ item }">
        {{ item.mn_bungae1 == 0 ? '' : formatPrice(item.mn_bungae1) }}
      </template>

      <template #item.mn_bungae2="{ item }">
        {{ item.mn_bungae2 == 0 ? '' : formatPrice(item.mn_bungae2) }}
      </template>

      <template #item.files="{ item }">
        <div
          class="group relative w-full"
          @mouseenter="handlePreviewPosition"
          @mouseleave="resetPreviewPosition"
        >
          <div class="group relative inline-block w-full">
            <!-- 파일 이름 리스트 -->
            <div class="overflow-hidden text-ellipsis whitespace-nowrap">
              <template v-if="item.files && item.files.length">
                <a
                  href="#"
                  @click.prevent="downloadAllFiles(item.files, item.nm_remark)"
                  class="block text-blue-500 hover:text-blue-600"
                  :title="
                    item.files.length === 1
                      ? item.files[0].file_name
                      : `${item.files[0].file_name} 외 ${item.files.length - 1}건`
                  "
                >
                  {{
                    item.files.length === 1
                      ? item.files[0].file_name
                      : `${item.files[0].file_name} 외 ${item.files.length - 1}건`
                  }}
                </a>
              </template>
            </div>

            <!-- 하나의 병합된 PDF 미리보기 -->
            <div
              v-if="item.files && item.merged_pdf_url"
              class="pdf-preview absolute top-full left-0 z-10 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
            >
              <embed :src="item.merged_pdf_url" type="application/pdf" class="h-full w-full" />
            </div>
          </div>
        </div>
      </template>

      <template #item.actions="{ item }">
        <input
          type="button"
          value="첨부"
          @click="openEditModal(item)"
          class="h-6 w-14 cursor-pointer rounded-sm border border-gray-300 bg-white pr-1.5 pl-1.5 text-sm hover:bg-black hover:text-white"
        />
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
  </div>
</template>

<style scoped></style>
