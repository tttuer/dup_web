<script setup>
import { ref, watch, onUnmounted, computed, onMounted, nextTick } from 'vue';
import Dropdown from './Dropdown.vue';
import { authFetch } from '../../utils/authFetch';
import DateSearch from './DateSearch.vue';
import EditModal from './EditModal.vue';
import { useTypeStore } from '@/stores/typeStore';
import { getRoleFromLocalStorage } from '@/utils/token';
import { groupOptions, groupNameToEnum, groupIdToName, loadGroupOptions } from '@/stores/group';
import BaseList from '@/components/base/BaseList.vue';
import UserInput from './UserInput.vue';
import Searchbar from './Searchbar.vue';
import { useToast } from 'vue-toastification';
import { useFileDownloader } from '@/composables/useFileDownloader';
import { usePdfPreview } from '@/composables/usePdfPreview';

const selectedGroup = ref('');
const roles = ref(getRoleFromLocalStorage());

const typeStore = useTypeStore();

const isLoading = ref(false);
const selectedCompany = ref('');
const fileLists = ref([]);
const totalPage = ref(0);
const currentPage = ref(1);
const isPdfConverting = ref(false);
const start_at = ref('');
const end_at = ref('');
const { handlePreviewPosition, resetPreviewPosition, generatePdfPreview } = usePdfPreview(fileLists);
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

const fileUrl = `${import.meta.env.VITE_FILE_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const editTargetFile = ref(null);
const lockFilter = ref(false);

const headers = ref([
    { text: '날짜', value: 'withdrawn_at', width: '8%' },
    { text: '설명', value: 'name', width: '60%' },
    { text: '첨부파일', value: 'file_name', width: '25%' },
    { text: '', value: 'actions', width: '5%' },
]);

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
      generatePdfPreview(file);
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

function formatDate(dateStr) {
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return `${year}/${month}/${day}`;
}

function handleIntersect() {
    currentPage.value++;
    fetchFiles();
}

function search() {
  fetchFiles(true);
}

const { downloadAllFiles } = useFileDownloader();

function downloadCheckedFiles() {
  const files = [...checkedIds.value].reduce((acc, id) => {
    const file = fileLists.value.find((v) => v.id === id);
    if (file.file_data) {
      acc.push(file);
    }
    return acc;
  }, []);

  downloadAllFiles(files);

  checkedIds.value.clear();
}

watch(selectedCompany, async (newCompany) => {
  selectedGroup.value = '';
  fileLists.value = [];
  if (newCompany) {
    await loadGroupOptions(newCompany);
  }
});

watch([selectedCompany, start_at, end_at, lockFilter, selectedGroup], async () => {
  if (selectedGroup.value) {
    await fetchFiles(true);
  }
});
</script>

<template>
  <div class="bg-testPink flex h-full w-full flex-col p-8">
    <div class="grid grid-cols-2">
      <div class="col-span-1 flex gap-1">
        <div class="max-w-30">
          <Dropdown
            @select="(select) => (selectedCompany = select)"
            :options="companyOptions"
            :nameToEnum="companyNameToEnum"
          />
        </div>

        <div class="max-w-40" v-show="selectedCompany">
          <Dropdown
            v-model="selectedGroup"
            @select="(select) => (selectedGroup = select)"
            :options="groupOptions"
            :nameToEnum="groupNameToEnum"
            :isGroupDropdown="true"
            :company="selectedCompany"
            @group-created="() => loadGroupOptions(selectedCompany)"
            @group-deleted="() => loadGroupOptions(selectedCompany)"
          />
        </div>

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
      </div>
    </div>

    <BaseList
        :headers="headers"
        :items="fileLists"
        :loading="isLoading || isPdfConverting"
        :checkedIds="checkedIds"
        @update:checkedIds="checkedIds = $event"
        :currentPage="currentPage"
        :totalPage="totalPage"
        @intersect="handleIntersect"
    >
        <template #fixed-body>
            <UserInput
                v-show="selectedGroup"
                :selectedCompany="selectedCompany"
                @createFiles="addCreatedFiles"
                :selectedGroupId="selectedGroup"
            />
        </template>

        <template #header.file_name="{ header }">
            <div class="flex justify-between">
                <div class="flex items-center justify-center">{{ header.text }}</div>
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
        </template>

        <template #item.withdrawn_at="{ item }">
            {{ formatDate(item.withdrawn_at) }}
        </template>

        <template #item.name="{ item }">
            <div class="flex items-center">
                {{ item.name }}
                <svg
                    v-if="item.lock"
                    xmlns="http://www.w3.org/2000/svg"
                    class="ml-1 h-4 w-4 text-gray-800"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        d="M12 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-3 0H9V9a3 3 0 1 1 6 0v2z"
                    />
                </svg>
            </div>
        </template>

        <template #item.file_name="{ item }">
            <div
                class="group relative w-full text-ellipsis whitespace-nowrap"
                @mouseenter="handlePreviewPosition"
                @mouseleave="resetPreviewPosition"
            >
                <div class="group relative inline-block w-full">
                    <div class="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        <a
                        :href="`data:application/pdf;base64,${item.file_data}`"
                        :download="item.file_name"
                        class="text-blue-500 hover:text-blue-600"
                        >
                        {{ item.file_name }}
                        </a>
                    </div>
                    <div
                        class="pdf-preview absolute top-full left-0 z-20 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
                    >
                        <embed
                            v-if="item.pdf_url"
                            :src="item.pdf_url"
                            type="application/pdf"
                            class="h-full w-full"
                        />
                    </div>
                </div>
            </div>
        </template>

        <template #item.actions="{ item }">
            <input
                type="button"
                value="수정"
                @click="openEditModal(item)"
                class="h-6 w-14 cursor-pointer rounded-sm border border-gray-300 bg-white pr-1.5 pl-1.5 text-sm hover:bg-black hover:text-white"
            />
        </template>
    </BaseList>

    <EditModal
      :visible="isEditModalOpen"
      :file="editTargetFile"
      @close="closeEditModal"
      @save="editFile"
    />
  </div>
</template>

<style scoped></style>
