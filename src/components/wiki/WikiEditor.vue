<template>
  <div class="flex flex-col h-full bg-white relative shadow-inner">
    <!-- Header -->
    <div class="px-6 py-3 border-b border-gray-200 flex flex-col gap-3 bg-gray-50 z-10">
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
        <div class="flex items-center space-x-2">
          <!-- Auto-save indicator -->
          <div class="text-xs text-gray-500 mr-2 flex items-center min-w-[120px] justify-end">
            <span v-if="isSaving" class="animate-pulse">임시저장 중...</span>
            <span v-else-if="lastSavedTime">마지막 저장: {{ lastSavedTime }}</span>
          </div>
          
          <button 
            @click="openDraftsModal" 
            class="px-4 py-2 rounded-md text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition shadow-sm"
          >
            임시저장 목록
          </button>
          
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

        <!-- Parent Selection -->
        <div class="flex items-center gap-2">
          <span class="font-medium">상위 폴더:</span>
          <WikiParentPicker
            v-model="parentId"
            :is-personal="isPersonal"
            :parents="availableParents"
          />
        </div>
      </div>
    </div>

    <!-- Editor & Attachments -->
    <div class="flex-1 overflow-hidden flex flex-col">
      <div class="flex-1 min-h-0">
        <Editor
          v-model="content"
          :init="editorConfig"
          tinymce-script-src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
          class="h-full"
        />
      </div>

      <!-- Attachments Section -->
      <div class="border-t border-gray-200 bg-gray-50 p-4 shrink-0">
        <div class="flex justify-between items-center mb-2">
          <label class="text-sm font-bold text-gray-700 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            첨부파일
          </label>
          <div class="relative">
            <input type="file" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="handleFileUpload" :disabled="isUploading">
            <button type="button" class="px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-100 shadow-sm" :class="{ 'opacity-50': isUploading }">
              {{ isUploading ? '업로드 중...' : '파일 추가' }}
            </button>
          </div>
        </div>
        
        <ul v-if="attachments.length > 0" class="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
          <li v-for="(file, index) in attachments" :key="index" class="flex justify-between items-center bg-white p-2.5 border border-gray-200 rounded-md text-sm shadow-sm group">
            <div class="flex items-center min-w-0">
              <span class="text-blue-500 mr-2 shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </span>
              <span class="truncate text-gray-700 font-medium">{{ file.file_name }}</span>
              <span class="text-xs text-gray-400 ml-2 shrink-0">({{ formatSize(file.size) }})</span>
            </div>
            <button @click="removeAttachment(index)" type="button" class="text-gray-400 hover:text-red-500 text-xs ml-2 shrink-0 px-2 py-1 rounded hover:bg-red-50 transition">
              삭제
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Drafts Modal -->
    <WikiDraftsModal 
      :isOpen="isDraftsModalOpen"
      :drafts="savedDrafts"
      @close="isDraftsModalOpen = false"
      @load="loadDraft"
      @delete="deleteDraft"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';
import WikiDraftsModal from './WikiDraftsModal.vue';
import WikiParentPicker from './WikiParentPicker.vue';
import { uploadImage, uploadAttachment } from '@/api/wiki';
import { useToast } from 'vue-toastification';
import { marked } from 'marked';

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

// File Attachments
const attachments = ref([]);
const isUploading = ref(false);

const handleFileUpload = async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  isUploading.value = true;
  try {
    for (let i = 0; i < files.length; i++) {
      const res = await uploadAttachment(files[i]);
      attachments.value.push(res);
    }
  } catch (err) {
    toast.error('파일 업로드에 실패했습니다.');
  } finally {
    isUploading.value = false;
    e.target.value = ''; // Reset input
  }
};

const removeAttachment = (index) => {
  attachments.value.splice(index, 1);
};

const formatSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Local storage autosave state
const isSaving = ref(false);
const lastSavedTime = ref(null);
const currentDraftId = ref(null);
const savedDrafts = ref([]);
const isDraftsModalOpen = ref(false);
let autoSaveTimeout = null;
let isInitialLoad = true;

const loadDrafts = () => {
  try {
    const raw = localStorage.getItem('wiki_drafts');
    savedDrafts.value = raw ? JSON.parse(raw) : [];
  } catch (e) {
    savedDrafts.value = [];
  }
};

const openDraftsModal = () => {
  loadDrafts();
  isDraftsModalOpen.value = true;
};

const deleteDraft = (id) => {
  savedDrafts.value = savedDrafts.value.filter(d => d.id !== id);
  localStorage.setItem('wiki_drafts', JSON.stringify(savedDrafts.value));
};

const loadDraft = (draft) => {
  isInitialLoad = true;
  title.value = draft.title;
  content.value = draft.content;
  parentId.value = draft.parentId || '';
  isPersonal.value = draft.isPersonal || false;
  attachments.value = draft.attachments || [];
  currentDraftId.value = draft.id;
  isDraftsModalOpen.value = false;
  toast.success('임시저장된 문서를 불러왔습니다.');
  setTimeout(() => { isInitialLoad = false; }, 500);
};

const triggerAutoSave = () => {
  if (isInitialLoad) return;
  if (!title.value && !content.value) return;
  
  isSaving.value = true;
  clearTimeout(autoSaveTimeout);
  
  autoSaveTimeout = setTimeout(() => {
    loadDrafts();
    const now = new Date().toISOString();
    
    if (!currentDraftId.value) {
      currentDraftId.value = Date.now().toString();
    }
    
    const draftData = {
      id: currentDraftId.value,
      title: title.value,
      content: content.value,
      parentId: parentId.value === '' ? null : parentId.value,
      isPersonal: isPersonal.value,
      attachments: attachments.value,
      pageId: props.initialData?.id || null,
      updatedAt: now
    };
    
    const existingIdx = savedDrafts.value.findIndex(d => d.id === currentDraftId.value);
    if (existingIdx >= 0) {
      savedDrafts.value[existingIdx] = draftData;
    } else {
      savedDrafts.value.unshift(draftData);
    }
    
    if (savedDrafts.value.length > 20) {
      savedDrafts.value = savedDrafts.value.slice(0, 20);
    }
    
    localStorage.setItem('wiki_drafts', JSON.stringify(savedDrafts.value));
    
    const d = new Date();
    lastSavedTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    isSaving.value = false;
  }, 2000);
};

watch([title, content, parentId, isPersonal, attachments], () => {
  triggerAutoSave();
}, { deep: true });

// Page unload warning
const handleBeforeUnload = (e) => {
  if ((title.value || content.value) && !isInitialLoad) {
    e.preventDefault();
    e.returnValue = '';
  }
};

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  loadDrafts();
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  clearTimeout(autoSaveTimeout);
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
  isInitialLoad = true;
  if (newVal) {
    title.value = newVal.title || '';
    parentId.value = newVal.parent_id || '';
    isPersonal.value = newVal.is_personal || false;
    attachments.value = newVal.attachments ? [...newVal.attachments] : [];
    
    // Check if it's markdown or html
    const rawContent = newVal.content || '';
    if (rawContent && !rawContent.trim().startsWith('<') && (rawContent.includes('\n') || rawContent.includes('#'))) {
      content.value = marked.parse(rawContent);
    } else {
      content.value = rawContent;
    }
  } else {
    title.value = '';
    content.value = '';
    parentId.value = '';
    isPersonal.value = false;
    attachments.value = [];
  }
  
  setTimeout(() => { isInitialLoad = false; }, 500);
}, { immediate: true });

const save = () => {
  if (!title.value.trim()) {
    toast.warning('제목을 입력해주세요.');
    return;
  }
  
  // 저장 성공 시 임시저장 내역 삭제
  if (currentDraftId.value) {
    deleteDraft(currentDraftId.value);
  }
  
  emit('save', { 
    title: title.value, 
    content: content.value,
    parent_id: parentId.value === '' ? null : parentId.value,
    is_personal: isPersonal.value,
    attachments: attachments.value
  });
};

const editorConfig = {
  height: '100%',
  menubar: false,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'codesample', 'wordcount'
  ],
  toolbar: 'undo redo | preview fullscreen | blocks | ' +
    'bold italic underline strikethrough | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'link image table | codesample removeformat | code',
  relative_urls: false,
  remove_script_host: false,
  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; padding: 1rem; cursor: text; user-select: text; -webkit-user-select: text; } img { max-width: 100%; height: auto; border-radius: 8px; } table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #ccc; padding: 8px; }',
  images_upload_handler: async (blobInfo, progress) => {
    try {
      const file = new File([blobInfo.blob()], blobInfo.filename() || 'image.png', { type: blobInfo.blob().type });
      const res = await uploadImage(file);
      
      const baseUrl = import.meta.env.VITE_WIKI_API_URL.split('/api')[0];
      return baseUrl + res.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Image upload failed');
    }
  },
  object_resizing: true,
  image_caption: true,
  table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
  language: 'ko_KR',
  language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.10.9/langs6/ko_KR.js',
  skin: 'oxide',
  content_css: 'default',
  branding: false,
  promotion: false,
  setup: (editor) => {
    editor.on('paste', (e) => {
      try {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;
        
        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');
        
        // 정규식을 사용해 뚜렷한 마크다운 문법(제목, 굵게, 리스트, 인용구)이 있는지 확인
        const isMarkdown = /^#+\s/m.test(textData) || /\*\*.+\*\*/.test(textData) || /^-\s/m.test(textData) || /^>\s/m.test(textData);
        
        // 이미 렌더링된 웹페이지 요소(h1, h2, 표 등)를 복사한 거라면 원본 HTML 형식을 존중
        const isRenderedHtml = htmlData && (htmlData.includes('<h1') || htmlData.includes('<h2') || htmlData.includes('<table'));

        // 마크다운 원문을 복사한 경우 (채팅창 등에서 복사할 때 숨겨진 htmlData가 들어오는 것 무시)
        if (textData && isMarkdown && !isRenderedHtml) {
          e.preventDefault();
          // marked.parse 결과를 안전하게 삽입
          const parsed = marked.parse(textData);
          Promise.resolve(parsed).then(parsedHtml => {
            editor.insertContent(parsedHtml);
          });
        }
      } catch (err) {
        console.error("Paste Markdown Error:", err);
      }
    });
  }
};
</script>
