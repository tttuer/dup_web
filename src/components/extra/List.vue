<script setup>
import { ref, watch, computed, nextTick, shallowRef } from 'vue';
import FolderSidebar from './FolderSidebar.vue';
import { authFetch } from '../../utils/authFetch';
import DateSearch from './DateSearch.vue';
import EditModal from './EditModal.vue';
import { useTypeStore } from '@/stores/useTypeStore';
import { getRoleFromLocalStorage } from '@/utils/token';
import { groupOptions, groupNameToEnum, groupIdToName, loadGroupOptions } from '@/stores/useGroupStore';
import BaseList from '@/components/base/BaseList.vue';
import UserInput from './UserInput.vue';
import Searchbar from './Searchbar.vue';
import { useToast } from 'vue-toastification';
import { useFileDownloader } from '@/composables/useFileDownloader';
import FileDeleteModal from './FileDeleteModal.vue';
import { companyNameToEnum, companyOptions } from '@/constants/companies';

const selectedGroup = ref('');
const roles = ref(getRoleFromLocalStorage());

const typeStore = useTypeStore();

const isLoading = ref(false);
const selectedCompany = ref('');
const fileLists = shallowRef([]);
const sidebarSearch = ref('');
const sidebarFileMatches = shallowRef([]);
const isSidebarFileSearchLoading = ref(false);
const totalPage = ref(0);
const currentPage = ref(1);
const isPdfConverting = ref(false);
const start_at = ref('');
const end_at = ref('');
const sortBy = ref('created_at');
const sortOrder = ref('desc');

function toggleSortOrder() {
  if (sortBy.value !== 'withdrawn_at') {
    sortBy.value = 'withdrawn_at';
    sortOrder.value = 'desc';
    return;
  }

  sortBy.value = 'withdrawn_at';
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
}
// PDF 미리보기 기능 지연 로딩
const searchbar = ref('');
const searchbarOption = ref('');
const checkedIds = ref(new Set());
const hasChecked = computed(() => checkedIds.value.size > 0);
const activeSearchTerm = computed(() => searchbar.value.trim());
const hasActiveSearch = computed(() => activeSearchTerm.value.length > 0);

const fileUrl = `${import.meta.env.VITE_FILE_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const editTargetFile = ref(null);
const lockFilter = ref(false);
let sidebarSearchTimer = null;
let sidebarSearchController = null;
let suppressNextAutoFetch = false;

const isFileDeleteModalOpen = ref(false);
const filesToDelete = computed(() => {
  return [...checkedIds.value].reduce((acc, id) => {
    const file = fileLists.value.find((v) => v.id === id);
    if (file) acc.push(file);
    return acc;
  }, []);
});

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
  sortBy.value = 'created_at';
  sortOrder.value = 'desc';
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
  params.append('sort_by', sortBy.value);
  params.append('order', sortOrder.value);

  isLoading.value = true;
  isPdfConverting.value = true;
  try {
    const response = await authFetch(fileUrl + '?' + params.toString());
    const [total_count, total_page, lists] = await response.json();

    totalPage.value = total_page;
    const newFiles = lists.map((file) => ({
      ...file,
    }));
    fileLists.value = [...fileLists.value, ...newFiles];
  } finally {
    isLoading.value = false;
    isPdfConverting.value = false;
  }
}

function getSidebarFileSearchGroups(files) {
  const groupsById = new Map();

  files.forEach((file) => {
    if (!file.group_id) return;

    const group = groupsById.get(file.group_id) || {
      groupId: file.group_id,
      groupName: groupIdToName.value[file.group_id] || '이름 없는 폴더',
      matchCount: 0,
      fileNames: [],
    };

    group.matchCount += 1;
    if (file.file_name && group.fileNames.length < 3) {
      group.fileNames.push(file.file_name);
    }

    groupsById.set(file.group_id, group);
  });

  return Array.from(groupsById.values()).sort((a, b) => a.groupName.localeCompare(b.groupName));
}

const sidebarFileSearchGroups = computed(() => getSidebarFileSearchGroups(sidebarFileMatches.value));

function handleSidebarSearch(query) {
  sidebarSearch.value = query;
}

function applyFileSearchGroup({ groupId, query }) {
  suppressNextAutoFetch = true;
  selectedGroup.value = groupId;
  searchbar.value = query;
  searchbarOption.value = 'DESCRIPTION_FILENAME';

  nextTick(() => {
    search();
  });
}

function clearSearchFilter() {
  searchbar.value = '';
  searchbarOption.value = 'DESCRIPTION_FILENAME';
  search();
}

function isSearchMatched(item) {
  const query = activeSearchTerm.value.toLowerCase();
  if (!query) return false;

  return [item.name, item.file_name]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function getHighlightedParts(value) {
  const text = String(value || '');
  const query = activeSearchTerm.value;
  if (!query) return [{ text, isMatch: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(lowerQuery);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      parts.push({ text: text.slice(cursor, matchIndex), isMatch: false });
    }

    const matchEnd = matchIndex + query.length;
    parts.push({ text: text.slice(matchIndex, matchEnd), isMatch: true });
    cursor = matchEnd;
    matchIndex = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), isMatch: false });
  }

  return parts.length ? parts : [{ text, isMatch: false }];
}

async function fetchSidebarFileMatches(query) {
  if (sidebarSearchController) {
    sidebarSearchController.abort();
  }

  const controller = new AbortController();
  sidebarSearchController = controller;
  const params = new URLSearchParams();
  params.append('type', typeStore.currentType);
  params.append('company', selectedCompany.value);
  params.append('page', 1);
  params.append('items_per_page', 50);
  params.append('search', query);
  params.append('search_option', 'DESCRIPTION_FILENAME');

  isSidebarFileSearchLoading.value = true;
  try {
    const response = await authFetch(fileUrl + '?' + params.toString(), {
      signal: controller.signal,
    });
    if (!response.ok) {
      sidebarFileMatches.value = [];
      return;
    }

    const [, , lists] = await response.json();
    sidebarFileMatches.value = lists || [];
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
      sidebarFileMatches.value = [];
    }
  } finally {
    if (sidebarSearchController === controller) {
      isSidebarFileSearchLoading.value = false;
    }
  }
}

function confirmDelete() {
  if (checkedIds.value.size === 0) return;
  isFileDeleteModalOpen.value = true;
}

function closeDeleteConfirmModal() {
  isFileDeleteModalOpen.value = false;
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
      closeDeleteConfirmModal();
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
    if (file.file_name) {
      acc.push(file);
    }
    return acc;
  }, []);

  downloadAllFiles(files);

  checkedIds.value.clear();
}

function handleGroupDeleted(deletedGroupId) {
  if (String(selectedGroup.value) === String(deletedGroupId)) {
    selectedGroup.value = '';
    fileLists.value = [];
    totalPage.value = 0;
    checkedIds.value = new Set();
  }

  loadGroupOptions(selectedCompany.value);
}

watch(selectedCompany, async (newCompany) => {
  selectedGroup.value = '';
  fileLists.value = [];
  sidebarFileMatches.value = [];
  if (newCompany) {
    await loadGroupOptions(newCompany);
  }
});

watch([selectedCompany, sidebarSearch], ([company, query]) => {
  if (sidebarSearchTimer) clearTimeout(sidebarSearchTimer);
  if (sidebarSearchController) {
    sidebarSearchController.abort();
    sidebarSearchController = null;
  }

  const normalizedQuery = query.trim();
  sidebarFileMatches.value = [];

  if (!company || normalizedQuery.length < 2) {
    isSidebarFileSearchLoading.value = false;
    return;
  }

  isSidebarFileSearchLoading.value = true;
  sidebarSearchTimer = setTimeout(() => {
    fetchSidebarFileMatches(normalizedQuery);
  }, 300);
});

// 디바운스된 fetch 함수 생성  
let debounceTimer = null;
const debouncedFetchFiles = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (suppressNextAutoFetch) {
    suppressNextAutoFetch = false;
    return;
  }

  debounceTimer = setTimeout(() => {
    if (selectedGroup.value) {
      fetchFiles(true);
    }
  }, 300);
};

watch([selectedCompany, start_at, end_at, lockFilter, selectedGroup, sortBy, sortOrder], debouncedFetchFiles);
</script>

<template>
  <div class="flex h-full w-full overflow-hidden bg-gray-50">
    <FolderSidebar
      :companyOptions="companyOptions"
      :companyNameToEnum="companyNameToEnum"
      :groupOptions="groupOptions"
      :groupNameToEnum="groupNameToEnum"
      :selectedCompany="selectedCompany"
      :selectedGroup="selectedGroup"
      :fileSearchGroups="sidebarFileSearchGroups"
      :isFileSearchLoading="isSidebarFileSearchLoading"
      @update:selectedCompany="(select) => (selectedCompany = select)"
      @update:selectedGroup="(select) => (selectedGroup = select)"
      @group-created="() => loadGroupOptions(selectedCompany)"
      @group-deleted="handleGroupDeleted"
      @search-change="handleSidebarSearch"
      @file-search-group-selected="applyFileSearchGroup"
    />

    <main class="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div class="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <div class="min-w-0">
          <h1 class="truncate text-xl font-bold text-gray-800">
            {{ selectedGroup ? groupIdToName[selectedGroup] : '폴더를 선택해주세요' }}
          </h1>
          <p class="mt-1 text-sm text-gray-400">
            {{ selectedCompany ? '왼쪽에서 폴더를 선택하면 업무파일을 확인할 수 있습니다.' : '회사를 먼저 선택해주세요.' }}
          </p>
          <div
            v-if="hasActiveSearch && selectedGroup"
            class="mt-2 inline-flex max-w-full items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
          >
            <span class="min-w-0 truncate">검색 결과: {{ activeSearchTerm }}</span>
            <button
              type="button"
              class="shrink-0 rounded px-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
              title="검색 해제"
              @click="clearSearchFilter"
            >
              X
            </button>
          </div>
        </div>

        <div class="flex shrink-0 flex-row justify-end">
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
            :modelValue="searchbar"
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

      <div class="min-h-0 flex-1 overflow-y-auto p-6">
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

        <template #header.withdrawn_at="{ header }">
            <div
                class="flex cursor-pointer select-none items-center justify-center transition-colors hover:text-blue-500"
                @click="toggleSortOrder"
            >
                <span>{{ header.text }}</span>
                <span
                    v-if="sortBy === 'withdrawn_at'"
                    class="ml-1 text-[10px] text-gray-500 dark:text-gray-400"
                >
                    {{ sortOrder === 'desc' ? '▼' : '▲' }}
                </span>
            </div>
        </template>

        <template #header.file_name="{ header }">
            <div class="flex justify-between">
                <div class="flex items-center justify-center">{{ header.text }}</div>
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
            <div
                class="flex items-center rounded px-2 py-1"
                :class="isSearchMatched(item) ? 'border-l-4 border-blue-400 bg-blue-50/80' : ''"
            >
                <span>
                  <template
                    v-for="(part, index) in getHighlightedParts(item.name)"
                    :key="`${item.id}-name-${index}`"
                  >
                    <mark v-if="part.isMatch" class="rounded bg-yellow-200 px-0.5 text-gray-900">{{ part.text }}</mark>
                    <span v-else>{{ part.text }}</span>
                  </template>
                </span>
                <span
                    v-if="isSearchMatched(item)"
                    class="ml-2 shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
                >
                    검색 결과
                </span>
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
            <div class="w-full text-ellipsis whitespace-nowrap">
                <div class="inline-block w-full">
                    <div class="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        <button
                        @click="downloadAllFiles([item])"
                        class="text-blue-500 hover:text-blue-600 cursor-pointer bg-transparent border-none p-0 text-left"
                        >
                        <template
                          v-for="(part, index) in getHighlightedParts(item.file_name)"
                          :key="`${item.id}-file-${index}`"
                        >
                          <mark v-if="part.isMatch" class="rounded bg-yellow-200 px-0.5 text-gray-900">{{ part.text }}</mark>
                          <span v-else>{{ part.text }}</span>
                        </template>
                        </button>
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
      </div>
    </main>

    <EditModal
      :visible="isEditModalOpen"
      :file="editTargetFile"
      @close="closeEditModal"
      @save="editFile"
    />
    <FileDeleteModal
      :visible="isFileDeleteModalOpen"
      :files="filesToDelete"
      @close="closeDeleteConfirmModal"
      @save="deleteFiles"
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
        
        <!-- 삭제 버튼 -->
        <button
          class="flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-red-500"
          @click="confirmDelete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          삭제
        </button>

        <!-- 일괄 저장 버튼 -->
        <button
          class="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-blue-500"
          @click="downloadCheckedFiles"
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
