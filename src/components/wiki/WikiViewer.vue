<template>
  <div class="h-full flex flex-col bg-white overflow-hidden relative">
    <!-- Header -->
    <div class="px-8 py-6 border-b border-gray-100 bg-white z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div>
        <!-- Breadcrumbs -->
        <nav v-if="breadcrumbs && breadcrumbs.length > 0" class="flex text-sm text-gray-500 mb-2 items-center space-x-1">
          <template v-for="(crumb, index) in breadcrumbs" :key="index">
            <span 
              v-if="crumb.id"
              @click="$emit('navigate', crumb.id)"
              class="hover:text-blue-600 hover:underline cursor-pointer transition-colors"
            >
              {{ crumb.title }}
            </span>
            <span v-else class="font-medium text-gray-600">
              {{ crumb.title }}
            </span>
            <svg v-if="index < breadcrumbs.length - 1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3 text-gray-400 mx-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </template>
        </nav>
        
        <h1 class="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">{{ page.title }}</h1>
        <div class="text-sm text-gray-500 flex items-center space-x-4">
          <span v-if="page.author" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {{ page.author.name || page.author }}
          </span>
          <span v-if="page.updatedAt" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatDate(page.updatedAt) }}
          </span>
        </div>
      </div>
      <div class="flex space-x-2">
        <button 
          @click="$emit('edit')" 
          class="px-5 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-bold hover:bg-blue-100 transition flex items-center shadow-sm border border-blue-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
          수정하기
        </button>
        <button 
          @click="$emit('delete')" 
          class="px-5 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-bold hover:bg-red-50 transition flex items-center shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          삭제
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex overflow-hidden bg-white">
      <!-- Main Document -->
      <div class="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-200" ref="scrollContainer">
        <div class="pb-8 prose prose-blue max-w-none wiki-content">
          <div v-html="processed.html"></div>
        </div>
        
        <!-- Attachments View -->
        <div v-if="page.attachments && page.attachments.length > 0" class="mt-12 border-t border-gray-200 pt-8 pb-12">
          <h3 class="text-base font-bold text-gray-800 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            첨부파일 ({{ page.attachments.length }})
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <a 
              v-for="file in page.attachments" 
              :key="file.id" 
              :href="getDownloadUrl(file.url)" 
              download
              target="_blank"
              class="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <div class="w-10 h-10 rounded bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 mr-3 shrink-0 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-gray-700 truncate group-hover:text-blue-700">{{ file.file_name }}</p>
                <p class="text-xs text-gray-500">{{ formatSize(file.size) }}</p>
              </div>
              <div class="text-gray-300 group-hover:text-blue-500 ml-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </div>
            </a>
          </div>
        </div>
      </div>
      
      <!-- TOC Sidebar -->
      <div v-if="processed.headings.length > 0" class="hidden lg:block w-64 border-l border-gray-100 bg-gray-50 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 shrink-0">
        <h4 class="text-sm font-bold text-gray-800 mb-4 tracking-wider flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-2 text-blue-600"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
          목차
        </h4>
        <ul class="space-y-2.5 text-sm">
          <li v-for="h in processed.headings" :key="h.id" :style="{ paddingLeft: `${(h.level-1)*0.75}rem` }">
            <a :href="`#${h.id}`" @click.prevent="scrollToHeading(h.id)" class="text-gray-600 hover:text-blue-600 transition-colors block truncate">
              {{ h.text }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted } from 'vue';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-sql';

const props = defineProps({
  page: {
    type: Object,
    required: true
  },
  breadcrumbs: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['edit', 'delete', 'navigate']);

const scrollContainer = ref(null);

const htmlContent = computed(() => {
  if (!props.page?.content) return '';
  const raw = props.page.content;
  if (!raw.trim().startsWith('<') && (raw.includes('\n') || raw.includes('#'))) {
    return marked.parse(raw);
  }
  return raw;
});

const processed = computed(() => {
  let raw = htmlContent.value;
  if (!raw) return { html: '', headings: [] };
  
  const div = document.createElement('div');
  div.innerHTML = raw;
  
  const headingsList = [];
  const elements = div.querySelectorAll('h1, h2, h3');
  
  elements.forEach((el, index) => {
    const id = `wiki-heading-${index}`;
    el.id = id;
    headingsList.push({
      id,
      text: el.innerText,
      level: parseInt(el.tagName.replace('H', ''))
    });
  });
  
  return {
    html: div.innerHTML,
    headings: headingsList
  };
});

const scrollToHeading = (id) => {
  const el = document.getElementById(id);
  if (el && scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: el.offsetTop - 30,
      behavior: 'smooth'
    });
  }
};

watch(() => processed.value.html, async () => {
  await nextTick();
  Prism.highlightAll();
}, { immediate: true });

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString('ko-KR');
};

const formatSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getDownloadUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_WIKI_API_URL.split('/api')[0];
  return baseUrl + url;
};

const confirmDelete = () => {
  if (confirm('정말로 이 페이지를 삭제하시겠습니까?')) {
    emit('delete', props.page.id);
  }
};
</script>

<style scoped>
/* Tailwind의 prose 클래스가 에디터(TinyMCE)에서 설정한 인라인 스타일/정렬을 방해하지 않도록 오버라이드 */
:deep(.wiki-content img) {
  display: revert !important;
  margin: revert !important;
  vertical-align: baseline !important;
  border-radius: 8px;
  max-width: 100%;
  height: auto;
}
:deep(.wiki-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: revert !important;
}
:deep(.wiki-content td), :deep(.wiki-content th) {
  border: 1px solid #e5e7eb;
  padding: 8px;
}
/* 리스트 및 마커 색상을 에디터처럼 진하게(검은색에 가깝게) 복구 */
:deep(.wiki-content li::marker) {
  color: #111827 !important;
  font-weight: bold;
}
:deep(.wiki-content ul), :deep(.wiki-content ol), :deep(.wiki-content li) {
  color: #111827 !important;
}
/* 중첩 리스트의 마커 모양이 1단계, 2단계, 3단계별로 달라지도록 강제 설정 */
:deep(.wiki-content ul) {
  list-style-type: disc !important;
}
:deep(.wiki-content ul ul) {
  list-style-type: circle !important;
}
:deep(.wiki-content ul ul ul) {
  list-style-type: square !important;
}
:deep(.wiki-content ol) {
  list-style-type: decimal !important;
}
:deep(.wiki-content ol ol) {
  list-style-type: lower-alpha !important;
}
:deep(.wiki-content ol ol ol) {
  list-style-type: lower-roman !important;
}
</style>
