let socket = null;
let onMessageCallback = null;
let reconnectTimer = null;

const wsUrl = `${import.meta.env.VITE_WS_URL}`;

export function connectSyncStatusSocket({ onMessage }) {
  if (socket && socket.readyState <= 1) return; // CONNECTING(0) or OPEN(1)이면 중복 연결 방지

  onMessageCallback = onMessage;
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
    if (onMessageCallback) {
      onMessageCallback(data);
    }
  };

  socket.onclose = () => {
    console.warn('[WebSocket] 🔌 Disconnected. Reconnecting in 3s...');
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = (error) => {
    console.error('[WebSocket] ❌ Error:', error);
    socket.close(); // 닫히면 onclose에서 reconnect됨
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    connectSyncStatusSocket({ onMessage: onMessageCallback });
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
