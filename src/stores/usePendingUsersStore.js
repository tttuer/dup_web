import { ref } from 'vue';
import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

export const usePendingUsersStore = defineStore('pendingUsers', () => {
  const pendingUsersCount = ref(0);
  let pendingUsersSocket = null;
  let isConnected = ref(false);

  function connectWebSocket() {
    // 이미 연결되어 있으면 연결하지 않음
    if (pendingUsersSocket && pendingUsersSocket.readyState === WebSocket.OPEN) {
      return;
    }

    // 관리자 권한 체크
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const roles = decoded.roles || [];
      const hasAdminRole = roles.includes('ADMIN');
      
      if (!hasAdminRole) return;
    } catch (e) {
      console.error('토큰 디코딩 실패:', e);
      return;
    }

    const wsUrl = `${import.meta.env.VITE_WS_URL_PENDING_USERS}?token=${token}`;
    
    pendingUsersSocket = new WebSocket(wsUrl);
    
    pendingUsersSocket.onopen = () => {
      console.log('📡 Pending users WebSocket connected');
      isConnected.value = true;
    };
    
    pendingUsersSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.pending_users_count !== undefined) {
          pendingUsersCount.value = data.pending_users_count;
        }
      } catch (error) {
        console.error('웹소켓 메시지 파싱 오류:', error);
      }
    };
    
    pendingUsersSocket.onerror = (error) => {
      console.error('📡 Pending users WebSocket error:', error);
      isConnected.value = false;
    };
    
    pendingUsersSocket.onclose = () => {
      console.log('📡 Pending users WebSocket disconnected');
      isConnected.value = false;
    };
  }

  function disconnectWebSocket() {
    if (pendingUsersSocket && pendingUsersSocket.readyState === WebSocket.OPEN) {
      pendingUsersSocket.close();
      pendingUsersSocket = null;
      isConnected.value = false;
    }
  }

  return {
    pendingUsersCount,
    isConnected,
    connectWebSocket,
    disconnectWebSocket
  };
});