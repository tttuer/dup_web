<template>
  <div 
    ref="treeContainerRef"
    class="relative h-full flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden shadow-sm z-10 flex-shrink-0"
    :style="{ width: sidebarWidth + 'px' }"
  >
    <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
      <h2 class="text-xl font-bold text-gray-800 tracking-tight">사내 위키</h2>
      <button @click="$emit('create', null)" class="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm" title="최상위에 새 페이지 생성">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
      </button>
    </div>

    <!-- Search Input -->
    <div class="px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          :value="searchQuery"
          @input="searchQuery = $event.target.value"
          type="text" 
          placeholder="문서 검색..." 
          class="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
        >
        <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Search Results View -->
    <div v-if="searchQuery" class="flex-1 overflow-y-auto p-2 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300">
      <div v-if="searchResults.length === 0" class="py-8 text-center text-sm text-gray-500">
        검색 결과가 없습니다.
      </div>
      <div 
        v-for="res in searchResults" 
        :key="res.id"
        @click="selectResult(res)"
        class="px-3 py-2.5 hover:bg-white rounded-md cursor-pointer mb-1 border border-transparent hover:border-gray-200 shadow-sm transition-all"
        :class="{ 'bg-blue-50 border-blue-200 text-blue-800': selectedId === res.id }"
      >
        <div class="text-sm font-bold truncate text-gray-800" :class="{ 'text-blue-700': selectedId === res.id }">{{ res.title }}</div>
        <div class="text-[11px] text-gray-400 truncate mt-1">{{ res.path }}</div>
      </div>
    </div>

    <!-- Normal Tree View -->
    <div v-else class="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 bg-white">
      <div class="mb-6">
        <h3 class="px-2 text-sm font-bold text-gray-500 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
          </svg>
          공용 위키
        </h3>
        <WikiTreeNode :nodes="publicTree" :selectedId="selectedId" @select="$emit('select', $event)" @reorder="$emit('reorder')" />
      </div>

      <div>
        <h3 class="px-2 text-sm font-bold text-gray-500 mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          개인 공간
        </h3>
        <WikiTreeNode :nodes="personalTree" :selectedId="selectedId" @select="$emit('select', $event)" @reorder="$emit('reorder')" />
      </div>
    </div>

    <!-- Resizer Handle -->
    <div 
      class="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 z-50 transition-colors"
      @mousedown.stop.prevent="startResize"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';
import WikiTreeNode from './WikiTreeNode.vue';

const props = defineProps({
  publicTree: {
    type: Array,
    default: () => [],
  },
  personalTree: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(['select', 'create', 'reorder']);

const searchQuery = ref('');

const flattenedNodes = computed(() => {
  const list = [];
  const traverse = (nodes, pathStr, isPersonal) => {
    for (const n of nodes) {
      const currentPath = pathStr ? `${pathStr} > ${n.title}` : (isPersonal ? '개인 공간' : '공용 위키') + ` > ${n.title}`;
      list.push({ ...n, path: currentPath });
      if (n.children) traverse(n.children, currentPath, isPersonal);
    }
  };
  traverse(props.publicTree, '', false);
  traverse(props.personalTree, '', true);
  return list;
});

const searchResults = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase().trim();
  return flattenedNodes.value.filter(n => n.title.toLowerCase().includes(q) || n.path.toLowerCase().includes(q));
});

const selectResult = (res) => {
  emit('select', { id: res.id });
  // searchQuery.value = ''; // Optional: uncomment if you want search to clear after selection
};

// Resizer Logic
const sidebarWidth = ref(256); // default 256px (w-64)
const treeContainerRef = ref(null);
let isResizing = false;

const startResize = (e) => {
  isResizing = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
};

const handleMouseMove = (e) => {
  if (!isResizing || !treeContainerRef.value) return;
  const rect = treeContainerRef.value.getBoundingClientRect();
  const newWidth = e.clientX - rect.left;
  sidebarWidth.value = Math.max(200, Math.min(newWidth, 800)); // min 200px, max 800px
};

const stopResize = () => {
  isResizing = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

onUnmounted(() => {
  if (isResizing) stopResize();
});
</script>
