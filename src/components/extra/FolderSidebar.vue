<script setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { FileText, Folder, Plus, Search, X } from 'lucide-vue-next';
import { authFetch } from '@/utils/authFetch';
import { useToast } from 'vue-toastification';
import GroupDelete from './GroupDelete.vue';
import UserAuth from './UserAuth.vue';

const RECENT_LIMIT = 5;
const RECENT_STORAGE_PREFIX = 'extraRecentGroups';

const props = defineProps({
  companyOptions: {
    type: Array,
    required: true,
  },
  companyNameToEnum: {
    type: Object,
    required: true,
  },
  groupOptions: {
    type: Array,
    required: true,
  },
  groupNameToEnum: {
    type: Object,
    required: true,
  },
  selectedCompany: {
    type: String,
    default: '',
  },
  selectedGroup: {
    type: [String, Number],
    default: '',
  },
  fileSearchGroups: {
    type: Array,
    default: () => [],
  },
  isFileSearchLoading: {
    type: Boolean,
    default: false,
  },
  groupHasUnreadChangesById: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits([
  'update:selectedCompany',
  'update:selectedGroup',
  'company-change',
  'group-created',
  'group-deleted',
  'search-change',
  'file-search-group-selected',
]);

const toast = useToast();
const groupUrl = `${import.meta.env.VITE_GROUP_API_URL}`;

const searchQuery = ref('');
const newGroupName = ref('');
const isCreating = ref(false);
const sidebarWidth = ref(288);
const sidebarRef = ref(null);
const recentGroupsByCompany = ref(loadRecentGroups());
let isResizing = false;

const companyEntries = computed(() => {
  return props.companyOptions.map((name) => ({
    name,
    value: props.companyNameToEnum[name],
  }));
});

const groups = computed(() => {
  return props.groupOptions.map((name) => ({
    name,
    id: props.groupNameToEnum[name],
  }));
});

const selectedGroupName = computed(() => {
  return groups.value.find((group) => isSameGroup(group.id, props.selectedGroup))?.name || '';
});

const filteredGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return groups.value;

  return groups.value.filter((group) => group.name.toLowerCase().includes(query));
});

const recentGroups = computed(() => {
  if (!props.selectedCompany) return [];

  const recentIds = recentGroupsByCompany.value[props.selectedCompany] || [];
  const groupMap = new Map(groups.value.map((group) => [String(group.id), group]));

  return recentIds.map((id) => groupMap.get(String(id))).filter(Boolean);
});

function loadRecentGroups() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_STORAGE_PREFIX) || '{}');
  } catch {
    return {};
  }
}

function saveRecentGroups(nextRecentGroups) {
  recentGroupsByCompany.value = nextRecentGroups;
  localStorage.setItem(RECENT_STORAGE_PREFIX, JSON.stringify(nextRecentGroups));
}

function rememberGroup(groupId) {
  if (!props.selectedCompany || !groupId) return;

  const current = recentGroupsByCompany.value[props.selectedCompany] || [];
  const normalizedGroupId = String(groupId);
  const nextForCompany = [
    normalizedGroupId,
    ...current.filter((id) => String(id) !== normalizedGroupId),
  ].slice(0, RECENT_LIMIT);

  saveRecentGroups({
    ...recentGroupsByCompany.value,
    [props.selectedCompany]: nextForCompany,
  });
}

function selectCompany(company) {
  emit('update:selectedCompany', company.value);
  emit('company-change', company.value);
}

function selectGroup(group) {
  emit('update:selectedGroup', group.id);
  rememberGroup(group.id);
}

function selectFileSearchGroup(group) {
  emit('update:selectedGroup', group.groupId);
  rememberGroup(group.groupId);
  emit('file-search-group-selected', {
    groupId: group.groupId,
    query: searchQuery.value.trim(),
  });
}

function updateSearchQuery(value) {
  searchQuery.value = value;
  emit('search-change', value);
}

function handleSearchInput(event) {
  updateSearchQuery(event.target.value);
}

async function createGroup() {
  const name = newGroupName.value.trim();
  if (!name || !props.selectedCompany || isCreating.value) return;

  isCreating.value = true;
  try {
    const res = await authFetch(`${groupUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company: props.selectedCompany }),
    });

    if (res.ok) {
      newGroupName.value = '';
      emit('group-created');
      toast.success('그룹이 생성되었습니다.');
    } else if (res.status === 409) {
      toast.error('이미 존재하는 그룹 이름입니다.');
    } else {
      toast.error('그룹 생성 실패');
    }
  } catch (error) {
    console.error(error);
    toast.error('그룹 생성 중 오류 발생');
  } finally {
    isCreating.value = false;
  }
}

function handleGroupDeleted(groupId) {
  const deletedGroupId = String(groupId);
  const nextRecentGroups = {
    ...recentGroupsByCompany.value,
    [props.selectedCompany]: (recentGroupsByCompany.value[props.selectedCompany] || []).filter(
      (id) => String(id) !== deletedGroupId,
    ),
  };

  saveRecentGroups(nextRecentGroups);
  emit('group-deleted', groupId);
}

function isSameGroup(left, right) {
  return String(left) === String(right);
}

function hasUnreadChanges(groupId) {
  return Boolean(props.groupHasUnreadChangesById[groupId]);
}

function startResize() {
  isResizing = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleMouseMove(event) {
  if (!isResizing || !sidebarRef.value) return;

  const rect = sidebarRef.value.getBoundingClientRect();
  const nextWidth = event.clientX - rect.left;
  sidebarWidth.value = Math.max(240, Math.min(nextWidth, 520));
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onUnmounted(() => {
  if (isResizing) stopResize();
});

watch(
  () => props.selectedCompany,
  () => {
    updateSearchQuery('');
    newGroupName.value = '';
  },
);
</script>

<template>
  <aside
    ref="sidebarRef"
    class="relative flex h-full shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm"
    :style="{ width: `${sidebarWidth}px` }"
  >
    <div class="border-b border-gray-200 p-4">
      <h2 class="mb-3 text-lg font-bold text-gray-800">업무파일</h2>
      <div class="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
        <button
          v-for="company in companyEntries"
          :key="company.value"
          type="button"
          class="rounded-md px-2 py-1.5 text-sm font-semibold transition-colors"
          :class="
            selectedCompany === company.value
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:bg-white/70 hover:text-gray-800'
          "
          @click="selectCompany(company)"
        >
          {{ company.name.replace('운수', '').replace('여객', '').replace('전기', '') }}
        </button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col">
      <div class="border-b border-gray-100 p-4">
        <div class="relative">
          <Search class="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
          <input
            :value="searchQuery"
            type="text"
            :disabled="!selectedCompany"
            placeholder="폴더/파일 검색..."
            class="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pr-8 pl-8 text-sm text-gray-800 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            @input="handleSearchInput"
            @compositionupdate="handleSearchInput"
            @compositionend="handleSearchInput"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute top-2 right-2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="검색어 지우기"
            @click="updateSearchQuery('')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-3 flex gap-2">
          <input
            v-model="newGroupName"
            type="text"
            :disabled="!selectedCompany"
            placeholder="새 폴더 이름"
            class="min-w-0 flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            @keyup.enter="createGroup"
          />
          <button
            type="button"
            :disabled="!selectedCompany || !newGroupName.trim() || isCreating"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            title="새 폴더 추가"
            @click="createGroup"
          >
            <Plus class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div v-if="!selectedCompany" class="flex flex-1 items-center justify-center px-6 text-center text-sm text-gray-400">
        회사를 선택하면 폴더 목록이 표시됩니다.
      </div>

      <div v-else class="min-h-0 flex-1 overflow-y-auto p-3">
        <section v-if="recentGroups.length && !searchQuery" class="mb-5">
          <h3 class="mb-2 px-2 text-xs font-bold tracking-wider text-gray-400 uppercase">최근 사용</h3>
          <button
            v-for="group in recentGroups"
            :key="`recent-${group.id}`"
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors"
            :class="
              isSameGroup(selectedGroup, group.id)
                ? 'bg-blue-50 font-semibold text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            "
            @click="selectGroup(group)"
          >
            <Folder class="h-4 w-4 shrink-0" :class="isSameGroup(selectedGroup, group.id) ? 'text-blue-500' : 'text-gray-400'" />
            <span class="truncate">{{ group.name }}</span>
            <span
              v-if="hasUnreadChanges(group.id)"
              class="h-2 w-2 shrink-0 rounded-full bg-blue-500"
              title="확인하지 않은 파일 변경이 있습니다"
            ></span>
          </button>
        </section>

        <section v-if="searchQuery.trim().length >= 2" class="mb-5">
          <div class="mb-2 flex items-center justify-between px-2">
            <h3 class="text-xs font-bold tracking-wider text-gray-400 uppercase">파일이 있는 폴더</h3>
            <span class="text-xs text-gray-400">{{ fileSearchGroups.length }}</span>
          </div>

          <div v-if="isFileSearchLoading" class="rounded-md border border-dashed border-blue-100 bg-blue-50/50 py-4 text-center text-sm text-blue-500">
            파일 검색 중...
          </div>

          <div v-else-if="fileSearchGroups.length === 0" class="rounded-md border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">
            일치하는 파일이 없습니다.
          </div>

          <div v-else class="space-y-0.5">
            <button
              v-for="group in fileSearchGroups"
              :key="`file-${group.groupId}`"
              type="button"
              class="flex w-full min-w-0 items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors"
              :class="
                isSameGroup(selectedGroup, group.groupId)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              "
              @click="selectFileSearchGroup(group)"
            >
              <FileText class="mt-0.5 h-4 w-4 shrink-0" :class="isSameGroup(selectedGroup, group.groupId) ? 'text-blue-500' : 'text-gray-400'" />
              <span class="min-w-0 flex-1">
                <span class="block truncate font-semibold">{{ group.groupName }}</span>
                <span class="block truncate text-xs text-gray-400">
                  {{ group.fileNames.join(', ') }}{{ group.matchCount > group.fileNames.length ? ` 외 ${group.matchCount - group.fileNames.length}건` : '' }}
                </span>
              </span>
              <span
                v-if="hasUnreadChanges(group.groupId)"
                class="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"
                title="확인하지 않은 파일 변경이 있습니다"
              ></span>
            </button>
          </div>
        </section>

        <section>
          <div class="mb-2 flex items-center justify-between px-2">
            <h3 class="text-xs font-bold tracking-wider text-gray-400 uppercase">
              {{ searchQuery ? '폴더 검색 결과' : '전체 폴더' }}
            </h3>
            <span class="text-xs text-gray-400">{{ filteredGroups.length }}</span>
          </div>

          <div v-if="filteredGroups.length === 0" class="py-8 text-center text-sm text-gray-400">
            폴더가 없습니다.
          </div>

          <div v-else class="space-y-0.5">
            <div
              v-for="group in filteredGroups"
              :key="group.id"
              class="group flex items-center rounded-md transition-colors"
              :class="isSameGroup(selectedGroup, group.id) ? 'bg-blue-50' : 'hover:bg-gray-100'"
            >
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
                :class="isSameGroup(selectedGroup, group.id) ? 'font-semibold text-blue-700' : 'text-gray-600'"
                @click="selectGroup(group)"
              >
                <Folder
                  class="h-4 w-4 shrink-0"
                  :class="isSameGroup(selectedGroup, group.id) ? 'text-blue-500' : 'text-gray-400'"
                />
                <span class="truncate">{{ group.name }}</span>
                <span
                  v-if="hasUnreadChanges(group.id)"
                  class="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                  title="확인하지 않은 파일 변경이 있습니다"
                ></span>
              </button>

              <div
                class="mr-2 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                :class="{ 'opacity-100': isSameGroup(selectedGroup, group.id) }"
                @click.stop
              >
                <UserAuth
                  :groupId="group.id"
                  :groupName="group.name"
                  :company="selectedCompany"
                />
                <GroupDelete
                  :groupId="group.id"
                  :groupName="group.name"
                  :company="selectedCompany"
                  @group-deleted="handleGroupDeleted"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div v-if="selectedGroupName" class="border-t border-gray-100 px-4 py-3">
        <p class="text-xs text-gray-400">선택된 폴더</p>
        <p class="truncate text-sm font-semibold text-gray-800">{{ selectedGroupName }}</p>
      </div>
    </div>

    <div
      class="absolute top-0 right-0 bottom-0 z-20 w-1.5 cursor-col-resize transition-colors hover:bg-blue-400 active:bg-blue-500"
      title="사이드바 크기 조절"
      @mousedown.stop.prevent="startResize"
    ></div>
  </aside>
</template>
