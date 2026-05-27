<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" @click.stop>
      <div class="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 class="font-bold text-gray-800">임시저장 목록</h3>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200">
        <div v-if="drafts.length === 0" class="text-center text-gray-500 py-8">
          임시저장된 문서가 없습니다.
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="draft in drafts" 
            :key="draft.id" 
            class="border border-gray-200 rounded p-4 hover:border-blue-400 hover:bg-blue-50 cursor-pointer flex justify-between items-start transition"
            @click="$emit('load', draft)"
          >
            <div class="flex-1 truncate pr-4">
              <h4 class="font-bold text-gray-800 truncate">{{ draft.title || '(제목 없음)' }}</h4>
              <p class="text-xs text-gray-500 mt-1">
                {{ draft.isPersonal ? '개인 공간' : '공용 위키' }} | {{ formatDate(draft.updatedAt) }}
              </p>
            </div>
            <button 
              @click.stop="$emit('delete', draft.id)" 
              class="text-red-400 hover:text-red-600 text-sm px-2 py-1 bg-white border border-red-200 rounded shadow-sm hover:bg-red-50 transition"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  drafts: Array
});

defineEmits(['close', 'load', 'delete']);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${mins}`;
};
</script>
