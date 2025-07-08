<script setup>
import { ref, watch } from 'vue';
import Dropdown from './Dropdown.vue';

const emit = defineEmits(['search']);
const search = ref('');
const searchOptions = ['설명+첨부파일'];
const searchToEnum = {
  '설명+첨부파일': 'DESCRIPTION_FILENAME',
};
const selectedOption = ref('');

function emitSearch() {
  emit('search', {
    search: search.value,
    searchOption: selectedOption.value,
  });
}

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
      placeholder="검색어 입력 후 Enter"
      v-model="search"
      @keyup.enter="emitSearch"
    />
  </div>
</template>

<style lang="scss" scoped></style>
