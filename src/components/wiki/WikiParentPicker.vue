<template>
  <div>
    <button
      type="button"
      class="flex h-9 w-[420px] max-w-full items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-left shadow-sm transition hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      :title="selectedFullPath"
      @click="openPicker"
    >
      <FolderOpen class="h-4 w-4 shrink-0 text-gray-400" />
      <span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">{{ selectedFullPath }}</span>
      <span class="shrink-0 text-xs font-semibold text-blue-600">변경</span>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @mousedown.self="closePicker"
      >
        <div class="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div class="flex items-start justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">상위 폴더 선택</h3>
              <p class="mt-1 text-xs text-gray-500">검색하거나 트리를 펼쳐 새 문서를 만들 위치를 지정하세요.</p>
            </div>
            <button
              type="button"
              class="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              title="닫기"
              @click="closePicker"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <div class="relative">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="폴더명 또는 전체 경로 검색"
              >
              <button
                v-if="searchQuery"
                type="button"
                class="absolute right-2 top-2 rounded p-1 text-gray-400 hover:text-gray-700"
                title="검색어 지우기"
                @click="searchQuery = ''"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="mt-3 inline-flex rounded-md border border-gray-200 bg-white p-1">
              <button
                type="button"
                class="rounded px-3 py-1.5 text-sm font-medium transition"
                :class="activeTab === 'search' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'"
                @click="activeTab = 'search'"
              >
                검색 결과
              </button>
              <button
                type="button"
                class="rounded px-3 py-1.5 text-sm font-medium transition"
                :class="activeTab === 'tree' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'"
                @click="activeTab = 'tree'"
              >
                트리에서 선택
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div v-if="activeTab === 'search'" class="space-y-2">
              <ParentOption
                :selected="modelValue === ''"
                title="최상위"
                :path="rootPath"
                @select="selectParent('')"
              />
              <ParentOption
                v-for="parent in searchResults"
                :key="parent.id"
                :selected="modelValue === parent.id"
                :title="parent.title"
                :path="formatFullPath(parent)"
                @select="selectParent(parent.id)"
              />
              <div v-if="searchResults.length === 0" class="rounded-md border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                검색 결과가 없습니다.
              </div>
            </div>

            <div v-else class="space-y-4">
              <ParentOption
                :selected="modelValue === ''"
                title="최상위"
                :path="rootPath"
                @select="selectParent('')"
              />
              <WikiParentTree
                :parents="filteredParents"
                :selected-id="modelValue"
                @select="selectParent"
              />
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-5 py-4">
            <div class="min-w-0 text-xs text-gray-500">
              <span class="font-semibold text-gray-700">선택 위치</span>
              <span class="ml-2 inline-block max-w-[520px] truncate align-bottom" :title="selectedFullPath">
                {{ selectedFullPath }}
              </span>
            </div>
            <button
              type="button"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
              @click="closePicker"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { FolderOpen, Search, X } from 'lucide-vue-next';
import WikiParentOption from './WikiParentOption.vue';
import WikiParentTree from './WikiParentTree.vue';

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: '',
  },
  isPersonal: {
    type: Boolean,
    default: false,
  },
  parents: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const activeTab = ref('tree');
const searchQuery = ref('');
const searchInputRef = ref(null);

const spaceLabel = computed(() => (props.isPersonal ? '개인 공간' : '공용 위키'));
const rootPath = computed(() => `${spaceLabel.value} / 최상위`);

const filteredParents = computed(() => props.parents.filter(parent => parent.is_personal === props.isPersonal));

const selectedParent = computed(() => filteredParents.value.find(parent => parent.id === props.modelValue));

const selectedFullPath = computed(() => selectedParent.value ? formatFullPath(selectedParent.value) : rootPath.value);

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const parents = filteredParents.value;

  if (!query) return parents.slice(0, 50);

  return parents
    .filter(parent => getSearchText(parent).includes(query))
    .slice(0, 50);
});

function getSearchText(parent) {
  return `${parent.title} ${parent.path || ''} ${formatFullPath(parent)}`.toLowerCase();
}

function formatFullPath(parent) {
  return `${parent.is_personal ? '개인 공간' : '공용 위키'} / ${(parent.path || parent.title).replaceAll(' > ', ' / ')}`;
}

function openPicker() {
  isOpen.value = true;
  activeTab.value = 'tree';
  nextTick(() => {
    if (searchQuery.value) searchInputRef.value?.focus();
  });
}

function closePicker() {
  isOpen.value = false;
}

function selectParent(id) {
  emit('update:modelValue', id);
}

watch(searchQuery, (query) => {
  if (query.trim()) activeTab.value = 'search';
});
</script>
