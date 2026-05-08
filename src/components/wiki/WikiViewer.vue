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

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-200 bg-white">
      <div class="max-w-4xl mx-auto pb-20">
        <MdPreview :editorId="id" :modelValue="page.content" language="ko-KR" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/preview.css';
import '@/utils/mdEditorConfig'; // 한국어 설정 로드

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
const id = 'wiki-preview';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString('ko-KR');
};

const confirmDelete = () => {
  if (confirm('정말로 이 페이지를 삭제하시겠습니까?')) {
    emit('delete', props.page.id);
  }
};
</script>
