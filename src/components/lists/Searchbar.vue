<script setup>
import { ref, watch } from 'vue';
import Dropdown from './Dropdown.vue';

const emit = defineEmits(['search']);
const search = ref('');
const searchOptions = ['계정과목', '거래처', '적요'];
const searchToEnum = {
  계정과목: 'NM_ACCTIT',
  거래처: 'NM_TRADE',
  적요: 'NM_REMARK',
};
const selectedOption = ref('');

// Enter 키나 watch에서 모두 이 함수 사용
function emitSearch() {
  emit('search', {
    search: search.value,
    searchOption: selectedOption.value,
  });
}

watch([search, selectedOption], () => emitSearch());
</script>

<template>
  <div class="flex">
    <Dropdown
      class="mr-2"
      :options="searchOptions"
      :nameToEnum="searchToEnum"
      @select="(select) => (selectedOption = select)"
    />
    <input
      class="h-9 rounded-sm border border-gray-300 pl-2"
      type="text"
      placeholder="검색"
      v-model="search"
      @keyup.enter="emitSearch"
    />
  </div>
</template>

<style lang="scss" scoped></style>
