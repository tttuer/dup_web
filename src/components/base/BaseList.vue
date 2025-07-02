<script setup>
import { computed, ref } from 'vue';
import Sentinel from '@/components/extra/Sentinel.vue'; // 경로 확인 필요

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

const emit = defineEmits(['update:checkedIds', 'intersect', 'check-all']);

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
    <div class="flex min-w-[1300px] flex-1 flex-col overflow-y-hidden">
      <div class="block h-14">
        <table class="h-full w-full min-w-[1300px] table-fixed">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th v-if="showCheckboxes" class="w-[2%] px-4 py-2 text-left">
                <input type="checkbox" :checked="isAllChecked" @change="handleCheckAll" />
              </th>
              <th
                v-for="header in headers"
                :key="header.value"
                :class="['px-4 py-2', header.align === 'right' ? 'text-right' : 'text-left', `w-[${header.width}]`]"
              >
                <slot :name="`header.${header.value}`" :header="header">
                  {{ header.text }}
                </slot>
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div>
        <table class="w-full min-w-[1300px] table-fixed">
            <slot name="fixed-body"></slot>
        </table>
      </div>

      <div class="no-scrollbar min-h-0 flex-1 overflow-y-scroll">
        <table class="w-full min-w-[1300px] table-fixed">
          <tbody>
            <tr
              v-for="(item, index) in items"
              :key="item.id"
              class="border-b border-gray-200 dark:border-gray-700"
            >
              <td v-if="showCheckboxes" class="w-[2%] px-4 py-2">
                <input
                  type="checkbox"
                  :checked="checkedIds.has(item.id)"
                  @click="handleCheckboxClick($event, index)"
                />
              </td>
              <td
                v-for="header in headers"
                :key="header.value"
                :class="['px-4 py-2', header.align === 'right' ? 'text-right' : 'text-left', `w-[${header.width}]`]"
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
  </div>
</template>

<style scoped>
/* 필요한 경우 스타일 추가 */
</style>
