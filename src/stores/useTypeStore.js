// src/stores/useTypeStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const TYPE = {
  VOUCHER: 'VOUCHER',
  EXTRA: 'EXTRA',
};

const typeLabelMap = {
  [TYPE.VOUCHER]: '전표 증빙자료',
  [TYPE.EXTRA]: '그 외',
};

export const useTypeStore = defineStore('type', () => {
  const currentType = ref('');

  function setType(type) {
    currentType.value = type;
  }

  const currentTypeLabel = computed(() => typeLabelMap[currentType.value] || '');

  return {
    currentType,
    setType,
    currentTypeLabel,
  };
});
