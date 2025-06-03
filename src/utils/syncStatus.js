// src/utils/syncStatus.js
import { useSyncStatusStore } from '@/stores/syncStatusStore';

let socket = null;
let reconnectTimer = null;

const wsUrl = `${import.meta.env.VITE_WS_URL}`;

export function connectSyncStatusSocket() {
  const store = useSyncStatusStore();

  if (socket && socket.readyState <= 1) return;

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('[WebSocket] ✅ Connected to sync-status');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('[WebSocket] 📩 Message:', data); // ← 이 로그 찍히나요?
    if ('syncing' in data) {
      store.setSyncing(data.syncing);
    }
  };

  socket.onclose = () => {
    console.warn('[WebSocket] 🔌 Disconnected. Reconnecting in 3s...');
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
