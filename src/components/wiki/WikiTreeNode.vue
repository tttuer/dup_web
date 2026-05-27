<template>
  <draggable
    :list="nodes"
    item-key="id"
    @end="onDragEnd"
    class="w-full"
    :class="{ 'pl-4 ml-2 border-l border-gray-200': !isRoot }"
  >
    <template #item="{ element: node }">
      <div class="text-sm text-gray-700 w-full relative">
        <div class="flex items-center w-full mb-0.5">
          <!-- Fold/Unfold Button (Independent Area) -->
        <button
          v-if="node.children && node.children.length > 0"
          @click.stop="toggleFolder(node)"
          class="w-7 h-8 flex items-center justify-center mr-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded transition-colors flex-shrink-0"
          title="접기/펴기"
        >
          <svg v-if="!isExpanded(node)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </button>
        <span v-else class="w-7 mr-1 flex-shrink-0"></span> <!-- Spacer for alignment -->
        
        <!-- Title & Document Icon (Clickable Area) -->
        <div
          class="flex-1 flex items-center px-2 h-8 hover:bg-gray-100 cursor-pointer rounded-md transition-colors overflow-hidden"
          :class="{ 'bg-blue-50 text-blue-700 font-bold': selectedId === node.id }"
          @click.stop="handleClick(node)"
          title="클릭하여 보기, 길게 눌러 드래그(순서 변경)"
        >
          <svg v-if="node.children && node.children.length > 0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-2 text-blue-400 flex-shrink-0">
            <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.205 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-2 text-gray-400 flex-shrink-0">
            <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd" />
          </svg>
          
          <span class="truncate">{{ node.title }}</span>
        </div>
      </div>

      <!-- Recursive node -->
      <WikiTreeNode
        v-if="node.children && isExpanded(node)"
        :nodes="node.children"
        :selectedId="selectedId"
        :isRoot="false"
        @select="$emit('select', $event)"
        @reorder="$emit('reorder')"
      />
    </div>
  </template>
</draggable>
</template>

<script setup>
import { ref } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: [Number, String],
    default: null,
  },
  isRoot: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['select', 'reorder']);
const expandedIds = ref(new Set());

const isExpanded = (node) => expandedIds.value.has(node.id);

const toggleFolder = (node) => {
  if (expandedIds.value.has(node.id)) {
    expandedIds.value.delete(node.id);
  } else {
    expandedIds.value.add(node.id);
  }
};

const handleClick = (node) => {
  emit('select', node);
};

const onDragEnd = () => {
  emit('reorder');
};
</script>
