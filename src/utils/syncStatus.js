// src/utils/syncStatus.js
import { useSyncStatusStore } from '@/stores/useSyncStatusStore';

let socket = null;
let reconnectTimer = null;

const wsUrl = `${import.meta.env.VITE_WS_URL}`;

export function connectSyncStatusSocket() {
  const store = useSyncStatusStore();

  if (socket && socket.readyState <= 1) return;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if ('syncing' in data) {
      store.setSyncing(data.syncing);
    }
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = (error) => {
    console.error('[WebSocket] ❌ Error:', error);
    socket.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    connectSyncStatusSocket();
  }, 3000);
}

export function disconnectSyncStatusSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
}
