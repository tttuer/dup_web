// src/stores/syncStatusStore.js
import { defineStore } from 'pinia';

export const useSyncStatusStore = defineStore('syncStatus', {
  state: () => ({
    syncing: false,
  }),
  actions: {
    setSyncing(status) {
      this.syncing = status;
    },
  },
});
