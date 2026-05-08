<template>
  <div class="flex flex-col h-full bg-white relative shadow-inner">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50 z-10">
      <div class="flex justify-between items-end w-full">
        <div class="flex-1 mr-6">
          <label class="block text-xs font-bold text-gray-500 mb-1.5 ml-1">문서 제목 <span class="text-red-500">*</span></label>
          <input 
            v-model="title" 
            type="text" 
            placeholder="여기에 문서 제목을 입력하세요" 
            class="w-full text-xl font-bold bg-white border border-gray-300 rounded-md px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition shadow-sm placeholder-gray-300 text-gray-800"
          >
        </div>
        <div class="flex space-x-2">
          <button 
            @click="$emit('cancel')" 
            class="px-5 py-2 rounded-md text-sm font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition shadow-sm"
          >
            취소
          </button>
          <button 
            @click="save" 
            class="px-5 py-2 rounded-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 mr-1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            저장
          </button>
        </div>
      </div>
      
      <!-- Space & Parent Selection -->
      <div class="flex items-center space-x-6 text-sm text-gray-600">
        <!-- Space Selection -->
        <div class="flex items-center">
          <span class="mr-3 font-medium">공간 선택:</span>
          <div class="flex space-x-4">
            <label class="flex items-center space-x-1 cursor-pointer">
              <input type="radio" :value="false" v-model="isPersonal" class="text-blue-600 focus:ring-blue-500 w-4 h-4">
              <span>공용 위키</span>
            </label>
            <label class="flex items-center space-x-1 cursor-pointer">
              <input type="radio" :value="true" v-model="isPersonal" class="text-blue-600 focus:ring-blue-500 w-4 h-4">
              <span>개인 공간</span>
            </label>
          </div>
        </div>

        <div class="w-px h-5 bg-gray-300"></div>

        <!-- Parent Selection (Searchable Dropdown) -->
        <div class="flex items-center">
          <span class="mr-2 font-medium">상위 폴더:</span>
          
          <div class="relative min-w-[260px]" ref="dropdownRef">
            <!-- Trigger -->
            <div 
              @click="isDropdownOpen = !isDropdownOpen"
              class="border border-gray-300 rounded px-3 py-1.5 bg-white cursor-pointer flex justify-between items-center hover:border-blue-400 transition shadow-sm"
            >
              <span class="truncate text-gray-700 text-sm" :class="{ 'text-gray-400': parentId === '' }">
                {{ selectedParentTitle }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <!-- Dropdown Menu -->
            <div 
              v-if="isDropdownOpen" 
              class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-xl"
            >
              <!-- Search Input -->
              <div class="p-2 border-b border-gray-100 bg-gray-50 rounded-t-md">
                <div class="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="폴더 검색..." 
                    class="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    @click.stop
                  >
                </div>
              </div>
              
              <!-- Options List -->
              <ul class="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-gray-200">
                <li 
                  @click="selectParent('')" 
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                  :class="{ 'bg-blue-50 text-blue-600 font-bold': parentId === '' }"
                >
                  최상위 (선택 안함)
                </li>
                <li 
                  v-for="node in searchedParents" 
                  :key="node.id" 
                  @click="selectParent(node.id)"
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 truncate"
                  :class="{ 'bg-blue-50 text-blue-600 font-bold': parentId === node.id }"
                >
                  {{ node.title }}
                </li>
                <li v-if="searchedParents.length === 0" class="px-3 py-4 text-sm text-center text-gray-500">
                  검색 결과가 없습니다
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div class="flex-1 overflow-hidden">
      <MdEditor 
        v-model="content" 
        language="ko-KR"
        @onUploadImg="onUploadImg"
        class="h-full border-0"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import '@/utils/mdEditorConfig'; // 한국어 설정 로드
import { uploadImage } from '@/api/wiki';
import { useToast } from 'vue-toastification';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  availableParents: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['save', 'cancel']);
const toast = useToast();

const title = ref('');
const content = ref('');
const parentId = ref('');
const isPersonal = ref(false);

// Custom Dropdown State
const isDropdownOpen = ref(false);
const searchQuery = ref('');
const dropdownRef = ref(null);

const filteredParents = computed(() => {
  return props.availableParents.filter(node => node.is_personal === isPersonal.value);
});

const searchedParents = computed(() => {
  if (!searchQuery.value) return filteredParents.value;
  const q = searchQuery.value.toLowerCase();
  return filteredParents.value.filter(n => n.title.toLowerCase().includes(q));
});

const selectedParentTitle = computed(() => {
  if (parentId.value === '') return '최상위 (선택 안함)';
  const found = props.availableParents.find(n => n.id === parentId.value);
  return found ? found.title : '최상위 (선택 안함)';
});

const selectParent = (id) => {
  parentId.value = id;
  isDropdownOpen.value = false;
  searchQuery.value = '';
};

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 공간(isPersonal)이 변경될 때마다 부모 선택 초기화 (단, 기존 선택값과 다를 때만)
watch(isPersonal, (newVal, oldVal) => {
  if (oldVal !== undefined && parentId.value !== '') {
    const parentNode = props.availableParents.find(n => n.id === parentId.value);
    if (parentNode && parentNode.is_personal !== newVal) {
      parentId.value = '';
    }
  }
});

// Initialize with data if editing
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    title.value = newVal.title || '';
    content.value = newVal.content || '';
    parentId.value = newVal.parent_id || '';
    isPersonal.value = newVal.is_personal || false;
  } else {
    title.value = '';
    content.value = '';
    parentId.value = '';
    isPersonal.value = false;
  }
}, { immediate: true });

const save = () => {
  if (!title.value.trim()) {
    toast.warning('제목을 입력해주세요.');
    return;
  }
  emit('save', { 
    title: title.value, 
    content: content.value,
    parent_id: parentId.value === '' ? null : parentId.value,
    is_personal: isPersonal.value
  });
};

const onUploadImg = async (files, callback) => {
  try {
    const urls = await Promise.all(
      files.map(async (file) => {
        const res = await uploadImage(file);
        return res.url; // 백엔드 반환 형태에 맞게 조정 필요
      })
    );
    callback(urls);
  } catch (error) {
    console.error('Image upload failed:', error);
    toast.error('이미지 업로드에 실패했습니다.');
  }
};
</script>
