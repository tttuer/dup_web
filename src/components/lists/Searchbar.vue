<script setup>
import { computed, ref, watch } from 'vue';
import Dropdown from './Dropdown.vue';

const searchOptions = ['계정과목', '거래처', '적요'];
const searchToEnum = {
  계정과목: 'NM_ACCTIT',
  거래처: 'NM_TRADE',
  적요: 'NM_REMARK',
};
const props = defineProps({
  searchValue: {
    type: String,
    default: '',
  },
  searchOption: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['search']);
const search = ref(props.searchValue);
const selectedOption = ref(props.searchOption);
const selectedOptionLabel = computed(
  () => searchOptions.find((option) => searchToEnum[option] === selectedOption.value) || '',
);

watch(
  () => [props.searchValue, props.searchOption],
  ([searchValue, searchOption]) => {
    search.value = searchValue;
    selectedOption.value = searchOption;
  },
);

// Enter 키나 watch에서 모두 이 함수 사용
function emitSearch() {
  emit('search', {
    search: search.value,
    searchOption: selectedOption.value,
  });
}

watch(selectedOption, (newValue) => {
  if (newValue) {
    emitSearch();
  }
});

</script>

<template>
  <div class="flex">
      <Dropdown
        class="mr-2"
        :options="searchOptions"
        :nameToEnum="searchToEnum"
        :selectedLabel="selectedOptionLabel"
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
