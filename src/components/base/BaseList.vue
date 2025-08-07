<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  headers: {
    type: Array,
    required: true,
  },
  items: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showCheckboxes: {
    type: Boolean,
    default: true,
  },
  checkedIds: {
    type: Set,
    default: () => new Set(),
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPage: {
    type: Number,
    default: 0,
  },
});

function getGroupKey(item) {
  return `${item.voucher_date}-${item.no_acct}`;
}

const itemsWithGroupInfo = computed(() => {
  if (!props.items || props.items.length === 0) return [];

  let groupIndex = 0;
  return props.items.map((item, index) => {
    let isFirstInGroup = false;
    if (index === 0) {
      isFirstInGroup = true;
    } else {
      const prevItem = props.items[index - 1];
      if (item.voucher_date !== prevItem.voucher_date || item.no_acct !== prevItem.no_acct) {
        groupIndex++;
        isFirstInGroup = true;
      }
    }
    return { ...item, groupIndex, isFirstInGroup };
  });
});

// 그룹 접기 없이 모든 아이템 표시 (그룹 구분은 유지)
const displayableItems = computed(() => {
  return itemsWithGroupInfo.value || [];
});

const emit = defineEmits([
  'update:checkedIds',
  'intersect',
  'check-all',
  'request-more-items',
]);

const container = ref(null);
const invisibleSentinel = ref(null);
let observer = null;

// Intersection Observer 설정
onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !props.loading && props.currentPage < props.totalPage) {
        handleIntersect();
      }
    });
  }, { 
    root: null, 
    threshold: 0.5, // 0.1 -> 0.5로 늘려서 더 빠른 감지
    rootMargin: '200px' // 200px 마진 추가로 더 빠른 트리거
  });
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});

// Sentinel 요소 감시
watch(
  () => invisibleSentinel.value,
  (newSentinel, oldSentinel) => {
    if (observer) {
      if (oldSentinel) {
        observer.unobserve(oldSentinel);
      }
      if (newSentinel) {
        observer.observe(newSentinel);
      }
    }
  }
);




const lastCheckedIndex = ref(null);

const isAllChecked = computed(() => {
  if (!props.items || props.items.length === 0) return false;
  return props.items.every((item) => props.checkedIds.has(item.id));
});

function handleCheckAll(event) {
  const newCheckedIds = new Set(props.checkedIds);
  if (event.target.checked) {
    props.items.forEach((item) => newCheckedIds.add(item.id));
  } else {
    props.items.forEach((item) => newCheckedIds.delete(item.id));
  }
  emit('update:checkedIds', newCheckedIds);
}

function handleCheckboxClick(event, index) {
  const item = props.items[index];
  const id = item.id;
  const newCheckedIds = new Set(props.checkedIds);

  if (event.shiftKey && lastCheckedIndex.value !== null) {
    const start = Math.min(lastCheckedIndex.value, index);
    const end = Math.max(lastCheckedIndex.value, index);
    const rangeItems = props.items.slice(start, end + 1);
    const clickedWasChecked = newCheckedIds.has(id);

    rangeItems.forEach((v) => {
      if (clickedWasChecked) {
        newCheckedIds.delete(v.id);
      } else {
        newCheckedIds.add(v.id);
      }
    });
  } else {
    if (newCheckedIds.has(id)) {
      newCheckedIds.delete(id);
    } else {
      newCheckedIds.add(id);
    }
  }

  lastCheckedIndex.value = index;
  emit('update:checkedIds', newCheckedIds);
}

function handleIntersect() {
  if (!props.loading && props.currentPage < props.totalPage) {
    emit('intersect');
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50 relative">
    <!-- 로딩 오버레이 -->
    <div 
      v-if="loading" 
      class="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center z-50 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center space-y-3">
        <svg
          class="size-8 animate-spin text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          ></path>
        </svg>
        <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">데이터를 불러오는 중...</p>
      </div>
    </div>
    
    <!-- 고정 헤더 테이블 -->
    <div
      ref="container"
      class="min-w-[1300px] flex-1 overflow-x-hidden overflow-y-auto no-scrollbar"
      :class="{ 'pointer-events-none': loading }"
    >
      <table class="w-full min-w-[1300px] table-fixed">
        <thead class="sticky top-0 z-10 bg-gray-100 dark:bg-gray-700">
          <tr>
            <th
              v-if="showCheckboxes"
              class="w-[4%] border-r border-gray-200 px-4 py-2 text-center dark:border-gray-600"
            >
              <input type="checkbox" :checked="isAllChecked" @change="handleCheckAll" />
            </th>
            <th
              v-for="header in headers"
              :key="header.value"
              :class="[
                'border-r border-gray-200 px-4 py-2 last:border-r-0 dark:border-gray-600',
                header.align === 'right' ? 'text-right' : 'text-center',
              ]"
              :style="{ width: header.width }"
            >
              <slot :name="`header.${header.value}`" :header="header">
                {{ header.text }}
              </slot>
            </th>
          </tr>
        </thead>
        <slot name="fixed-body"></slot>
        <tbody>
          <tr
            v-for="(item, index) in displayableItems"
            :key="item.id"
            class="border-b border-gray-200 dark:border-gray-700"
            :class="
              item.groupIndex % 2 === 0
                ? 'bg-white dark:bg-gray-900'
                : 'bg-blue-50 dark:bg-gray-800'
            "
          >
            <td
              v-if="showCheckboxes"
              class="w-[4%] border-r border-gray-200 px-4 py-2 dark:border-gray-600"
            >
              <input
                type="checkbox"
                :checked="checkedIds.has(item.id)"
                @click="handleCheckboxClick($event, index)"
              />
            </td>
            <td
              v-for="header in headers"
              :key="header.value"
              :class="[
                'border-r border-gray-200 px-4 py-2 last:border-r-0 dark:border-gray-600',
                header.align === 'right' ? 'text-right' : 'text-left',
              ]"
              :style="{ width: header.width }"
            >
              <slot :name="`item.${header.value}`" :item="item" :index="index">
                {{ item[header.value] }}
              </slot>
            </td>
          </tr>
          <!-- 보이지 않는 Sentinel - 더 빠른 감지를 위해 높이 추가 -->
          <tr v-if="currentPage < totalPage" ref="invisibleSentinel" class="h-10 opacity-0">
            <td :colspan="headers.length + (showCheckboxes ? 1 : 0)"></td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && items.length === 0" class="flex justify-center items-center p-4">
        <p>데이터가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 필요한 경우 스타일 추가 */
</style>
