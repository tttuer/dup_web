<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import Sentinel from '@/components/shared/Sentinel.vue';

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

const foldedGroups = ref(new Set());
const requestingMore = ref(false);

function getGroupKey(item) {
  return `${item.voucher_date}-${item.no_acct}`;
}

function toggleGroup(item) {
  const key = getGroupKey(item);
  if (foldedGroups.value.has(key)) {
    foldedGroups.value.delete(key);
  } else {
    foldedGroups.value.add(key);
  }
  
  // 접기/펼치기 후 화면 높이 체크하여 필요시 더 많은 데이터 로드
  nextTick(() => {
    setTimeout(() => {
      checkAndRequestMoreItems();
    }, 300); // 딜레이 증가로 반응성 개선
  });
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

const displayableItems = computed(() => {
  if (!itemsWithGroupInfo.value || itemsWithGroupInfo.value.length === 0) return [];

  return itemsWithGroupInfo.value.filter((item) => {
    const key = getGroupKey(item);
    if (foldedGroups.value.has(key)) {
      return item.isFirstInGroup;
    }
    return true;
  });
});

const emit = defineEmits([
  'update:checkedIds',
  'intersect',
  'check-all',
  'request-more-items',
]);

const container = ref(null);

watch(
  [() => props.items, () => displayableItems.value, () => foldedGroups.value.size],
  () => {
    // props.loading이 false일 때만 체크
    if (!props.loading) {
      nextTick(() => {
        setTimeout(() => {
          checkAndRequestMoreItems();
        }, 100);
      });
    }
  },
  { deep: true },
);

// 로딩이 끝났을 때 requestingMore 리셋
watch(
  () => props.loading,
  (newLoading) => {
    if (!newLoading) {
      requestingMore.value = false;
      // 로딩이 끝난 후 다시 체크
      nextTick(() => {
        setTimeout(() => {
          checkAndRequestMoreItems();
        }, 200);
      });
    }
  }
);

function checkAndRequestMoreItems() {
  if (!container.value || props.loading || props.currentPage >= props.totalPage || requestingMore.value) {
    return;
  }

  const containerHeight = container.value.clientHeight;
  const contentHeight = container.value.scrollHeight;
  const threshold = 500; // 500px 여유 공간이 있으면 로딩 (더 적극적으로)
  
  // 디버깅 로그
  console.log('Height check:', {
    containerHeight,
    contentHeight,
    diff: contentHeight - containerHeight,
    shouldLoad: contentHeight - containerHeight < threshold,
    displayableItemsCount: displayableItems.value.length,
    totalItemsCount: props.items.length,
    foldedGroupsCount: foldedGroups.value.size,
    loading: props.loading,
    currentPage: props.currentPage,
    totalPage: props.totalPage,
    requestingMore: requestingMore.value
  });
  
  if (contentHeight - containerHeight < threshold) {
    requestingMore.value = true;
    emit('request-more-items');
    
    // 타임아웃으로 강제 리셋 (무한 루프 방지)
    setTimeout(() => {
      requestingMore.value = false;
    }, 2000);
  }
}

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
  <div class="flex flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50">
    <!-- 고정 헤더 테이블 -->
    <div
      ref="container"
      class="min-w-[1300px] flex-1 overflow-x-hidden overflow-y-auto no-scrollbar"
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
              <div class="flex items-center">
                <input
                  type="checkbox"
                  :checked="checkedIds.has(item.id)"
                  @click="handleCheckboxClick($event, index)"
                  class="mr-2"
                />
                <button
                  v-if="item.isFirstInGroup"
                  @click="toggleGroup(item)"
                  class="flex h-5 w-5 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="h-5 w-5"
                    :class="[
                      foldedGroups.has(getGroupKey(item))
                        ? 'text-blue-500'
                        : 'text-gray-500',
                    ]"
                  >
                    <path
                      v-if="foldedGroups.has(getGroupKey(item))"
                      fill-rule="evenodd"
                      d="M7.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 10 7.293 6.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                    <path
                      v-else
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
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
          <Sentinel v-if="currentPage < totalPage" :onIntersect="handleIntersect" />
        </tbody>
      </table>
      <div v-if="loading" class="flex justify-center items-center p-4">
        <p>로딩 중...</p>
      </div>
      <div v-if="!loading && items.length === 0" class="flex justify-center items-center p-4">
        <p>데이터가 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 필요한 경우 스타일 추가 */
</style>
