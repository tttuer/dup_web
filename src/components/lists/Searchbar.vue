<script setup>
import { ref, watch } from "vue";
import Dropdown from "./Dropdown.vue";

const emit = defineEmits(["search"]);
const search = ref("");
const searchOptions = ["설명+첨부파일", "금액"];
const searchToEnum = {
  "설명+첨부파일": "DESCRIPTION_FILENAME",
  금액: "PRICE",
};

console.log(searchOptions.value);

watch([search, searchOptions], () => {
  emit("search", {
    search: search.value,
    searchOption: searchToEnum[searchOptions.value],
  });
});
</script>

<template>
  <div class="flex">
    <Dropdown
      class="mr-2"
      :options="searchOptions"
      :nameToEnum="searchToEnum"
    />
    <input
      class="h-9 rounded-sm border border-gray-300 pl-2"
      type="text"
      placeholder="검색"
      v-model="search"
    />
  </div>
</template>

<style lang="scss" scoped></style>
