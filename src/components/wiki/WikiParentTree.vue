<template>
  <div class="rounded-md border border-gray-200 bg-white py-2">
    <div v-if="visibleRows.length === 0" class="px-3 py-6 text-center text-sm text-gray-500">
      선택할 폴더가 없습니다.
    </div>

    <div
      v-for="{ parent, depth } in visibleRows"
      :key="parent.id"
      class="flex items-center rounded-md px-2 py-1.5 transition"
      :class="selectedId === parent.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'"
      :style="{ paddingLeft: `${depth * 18 + 8}px` }"
    >
      <button
        type="button"
        class="mr-1 flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        :title="hasChildren(parent.id) ? '접기/펴기' : ''"
        @click="toggle(parent.id)"
      >
        <ChevronRight
          v-if="hasChildren(parent.id)"
          class="h-4 w-4 transition-transform"
          :class="{ 'rotate-90': expandedIds.has(parent.id) }"
        />
        <span v-else class="h-4 w-4"></span>
      </button>

      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
        :title="formatFullPath(parent)"
        @click="$emit('select', parent.id)"
      >
        <component
          :is="hasChildren(parent.id) ? Folder : FileText"
          class="h-4 w-4 shrink-0"
          :class="hasChildren(parent.id) ? 'text-blue-400' : 'text-gray-400'"
        />
        <span class="truncate text-sm font-medium">{{ parent.title }}</span>
        <Check v-if="selectedId === parent.id" class="ml-auto h-4 w-4 shrink-0 text-blue-600" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Check, ChevronRight, FileText, Folder } from 'lucide-vue-next';

const props = defineProps({
  parents: {
    type: Array,
    required: true,
  },
  selectedId: {
    type: [Number, String],
    default: '',
  },
});

defineEmits(['select']);

const expandedIds = ref(new Set());

const parentById = computed(() => new Map(props.parents.map(parent => [parent.id, parent])));

const childrenByParent = computed(() => {
  const map = new Map();

  props.parents.forEach(parent => {
    const key = parent.parent_id || null;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(parent);
  });

  return map;
});

const visibleRows = computed(() => {
  const rows = [];

  const appendRows = (parentId = null, depth = 0) => {
    const children = childrenByParent.value.get(parentId) || [];

    children.forEach(parent => {
      rows.push({ parent, depth });
      if (expandedIds.value.has(parent.id)) appendRows(parent.id, depth + 1);
    });
  };

  appendRows();
  return rows;
});

function hasChildren(parentId) {
  return (childrenByParent.value.get(parentId) || []).length > 0;
}

function toggle(parentId) {
  if (!hasChildren(parentId)) return;

  const next = new Set(expandedIds.value);
  next.has(parentId) ? next.delete(parentId) : next.add(parentId);
  expandedIds.value = next;
}

function formatFullPath(parent) {
  return `${parent.is_personal ? '개인 공간' : '공용 위키'} / ${(parent.path || parent.title).replaceAll(' > ', ' / ')}`;
}

function expandSelectedAncestors() {
  const selected = parentById.value.get(props.selectedId);
  if (!selected) return;

  const next = new Set(expandedIds.value);
  let current = parentById.value.get(selected.parent_id);

  while (current) {
    next.add(current.id);
    current = parentById.value.get(current.parent_id);
  }

  expandedIds.value = next;
}

watch(
  () => [props.selectedId, props.parents],
  expandSelectedAncestors,
  { immediate: true },
);
</script>
