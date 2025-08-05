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

const foldedGroups = ref(new Set());
const requestingMore = ref(false);
const lastAutoLoadTime = ref(0);
const continuousLoading = ref(false); // 연속 로딩 상태

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
  
  // 접기/펼치기 후 화면 체크
  nextTick(() => {
    setTimeout(() => {
      const needsContinue = checkAndRequestMoreIfNeeded();
      if (!needsContinue) {
        continuousLoading.value = false;
      }
    }, 100);
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
  }, { root: null, threshold: 0.1 });
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

// 로딩 상태 관리 및 재귀 체크
watch(
  () => props.loading,
  (newLoading, oldLoading) => {
    if (oldLoading && !newLoading) {
      requestingMore.value = false;
      // 로딩 완료 후 화면이 부족하면 계속 로딩
      nextTick(() => {
        setTimeout(() => {
          const needsContinue = checkAndRequestMoreIfNeeded();
          if (!needsContinue) {
            continuousLoading.value = false; // 연속 로딩 종료
          }
        }, 100);
      });
    }
  }
);

// 접기/펼치기 후 화면 체크 (접힌 그룹이 있을 때만)
watch(
  () => displayableItems.value.length,
  () => {
    if (!props.loading && foldedGroups.value.size > 0) {
      nextTick(() => {
        setTimeout(() => {
          checkAndRequestMoreIfNeeded();
        }, 100);
      });
    }
  }
);

// 화면이 부족하면 계속 로딩하는 함수 (접힌 그룹이 있을 때만)
function checkAndRequestMoreIfNeeded() {
  const now = Date.now();
  
  if (!container.value || props.loading || props.currentPage >= props.totalPage || requestingMore.value || 
      foldedGroups.value.size === 0) {
    return;
  }
  
  // 화면이 심각하게 비어있지 않으면 쿨다운 적용
  const containerHeight = container.value.clientHeight;
  const contentHeight = container.value.scrollHeight;
  const scrollableHeight = contentHeight - containerHeight;
  const isSeriouslyEmpty = scrollableHeight < 200; // 스크롤할 수 있는 높이가 200px 미만이면 심각하게 비어있음
  
  console.log('Cooldown check:', {
    containerHeight,
    contentHeight,
    scrollableHeight,
    isSeriouslyEmpty,
    timeSinceLastLoad: now - lastAutoLoadTime.value,
    shouldSkip: !isSeriouslyEmpty && now - lastAutoLoadTime.value < 500
  });
  
  if (!isSeriouslyEmpty && now - lastAutoLoadTime.value < 500) {
    return;
  }
  
  // 뷰포트에 실제로 보이는 데이터 행 계산
  const tbody = container.value.querySelector('tbody');
  let visibleDataRows = 0;
  
  if (tbody) {
    const containerRect = container.value.getBoundingClientRect();
    const containerTop = containerRect.top;
    const containerBottom = containerRect.bottom;
    
    const allRows = tbody.querySelectorAll('tr');
    allRows.forEach(row => {
      const hasCheckbox = row.querySelector('input[type="checkbox"]');
      const hasSpinner = row.querySelector('.animate-spin');
      const hasLoadingText = row.textContent.includes('불러오는 중') || row.textContent.includes('로딩');
      
      // 실제 데이터 행만 카운트
      if (hasCheckbox && !hasSpinner && !hasLoadingText) {
        const rowRect = row.getBoundingClientRect();
        if (rowRect.bottom > containerTop && rowRect.top < containerBottom) {
          visibleDataRows++;
        }
      }
    });
  }
  
  const minRequiredRows = Math.floor(containerHeight / 60);
  
  // 접힌 그룹의 실제 숨겨진 아이템 수 계산
  const foldedCount = foldedGroups.value.size;
  let hiddenItemsCount = 0;
  
  if (foldedCount > 0) {
    // 전체 아이템에서 표시되는 아이템을 뺀 숨겨진 아이템 수
    hiddenItemsCount = props.items.length - displayableItems.value.length;
  }
  
  // 숨겨진 아이템이 많을수록 더 적극적으로 로딩
  const hiddenRatio = props.items.length > 0 ? hiddenItemsCount / props.items.length : 0;
  
  // 조건들을 숨겨진 아이템 비율에 따라 조정
  const heightThreshold = hiddenRatio > 0.7 ? 800 : hiddenRatio > 0.5 ? 600 : 400;
  const needMoreByHeight = contentHeight - containerHeight < heightThreshold;
  
  const requiredRowsMultiplier = hiddenRatio > 0.7 ? 3 : hiddenRatio > 0.5 ? 2 : 1;
  const requiredRows = minRequiredRows * requiredRowsMultiplier;
  const needMoreByRows = visibleDataRows < requiredRows;
  
  const ratioThreshold = hiddenRatio > 0.7 ? 0.8 : hiddenRatio > 0.5 ? 0.6 : 0.4;
  const needMoreByRatio = displayableItems.value.length > 0 ? 
    (visibleDataRows / displayableItems.value.length) < ratioThreshold : false;
  
  console.log('Check if more needed:', {
    containerHeight,
    contentHeight,
    scrollableHeight,
    visibleDataRows,
    totalItems: props.items.length,
    displayableItems: displayableItems.value.length,
    hiddenItemsCount,
    hiddenRatio,
    heightThreshold,
    requiredRows,
    ratioThreshold,
    isSeriouslyEmpty,
    needMoreByHeight,
    needMoreByRows,
    needMoreByRatio,
    foldedGroupsSize: foldedGroups.value.size,
    shouldLoad: (needMoreByHeight || needMoreByRows || needMoreByRatio) && foldedGroups.value.size > 0
  });
  
  // 접힌 그룹이 있고, 여러 조건 중 하나라도 만족하면 로딩
  if ((needMoreByHeight || needMoreByRows || needMoreByRatio) && foldedGroups.value.size > 0) {
    lastAutoLoadTime.value = now;
    requestingMore.value = true;
    continuousLoading.value = true; // 연속 로딩 시작
    emit('request-more-items');
    return true; // 더 로딩이 필요함을 반환
  }
  
  return false; // 더 이상 로딩 불필요
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
  <div class="flex flex-1 flex-col overflow-x-auto overflow-y-hidden rounded-lg border-2 border-gray-200 bg-white outline outline-white/5 dark:border-gray-700 dark:bg-gray-950/50 relative">
    <!-- 로딩 오버레이 -->
    <div 
      v-if="loading || continuousLoading" 
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
      :class="{ 'pointer-events-none': loading || continuousLoading }"
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
          <!-- 보이지 않는 Sentinel -->
          <tr v-if="currentPage < totalPage" ref="invisibleSentinel" class="h-0 opacity-0">
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
