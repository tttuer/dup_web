// src/stores/useApprovalNotificationStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useApprovalNotificationStore = defineStore('approvalNotification', () => {
  // 상태 관리
  const pendingApprovalCount = ref(0);
  const isConnected = ref(false);
  const notifications = ref([]);
  const websocket = ref(null);
  const pingInterval = ref(null);

  // WebSocket URL
  const wsUrl = import.meta.env.VITE_WS_URL_APPROVAL_NOTIFICATIONS;

  // WebSocket 연결
  const connectWebSocket = () => {
    // 이미 연결 중이거나 연결된 경우 건너뛰기
    if (websocket.value?.readyState === WebSocket.OPEN || websocket.value?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    // 기존 연결이 있으면 완전히 정리
    if (websocket.value) {
      disconnectWebSocket();
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ 인증 토큰이 없어 전자결재 WebSocket 연결을 건너뜁니다.');
      return;
    }

    try {
      const url = `${wsUrl}?token=${encodeURIComponent(token)}`;
      
      websocket.value = new WebSocket(url);

      websocket.value.onopen = () => {
        isConnected.value = true;
        
        // 연결 즉시 현재 대기 건수 요청
        websocket.value.send('get_pending_count');
        
        // 기존 ping interval이 있으면 정리
        if (pingInterval.value) {
          clearInterval(pingInterval.value);
        }
        
        // 30초마다 ping 전송 (연결 유지)
        pingInterval.value = setInterval(() => {
          if (websocket.value?.readyState === WebSocket.OPEN) {
            websocket.value.send('ping');
          }
        }, 30000);
      };

      websocket.value.onmessage = (event) => {
        try {
          if (event.data === 'pong') {
            return;
          }

          const data = JSON.parse(event.data);
          
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ 전자결재 WebSocket 메시지 파싱 오류:', error);
        }
      };

      websocket.value.onclose = (event) => {
        isConnected.value = false;
        
        // ping interval 정리
        if (pingInterval.value) {
          clearInterval(pingInterval.value);
          pingInterval.value = null;
        }
        
        // 재연결 시도 (3초 후)
        if (event.code !== 1000) { // 정상 종료가 아닌 경우
          setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      websocket.value.onerror = (error) => {
        console.error('❌ 전자결재 WebSocket 오류:', error);
        isConnected.value = false;
        
        // ping interval 정리
        if (pingInterval.value) {
          clearInterval(pingInterval.value);
          pingInterval.value = null;
        }
      };

    } catch (error) {
      console.error('❌ 전자결재 WebSocket 연결 실패:', error);
    }
  };

  // WebSocket 메시지 처리
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'pending_count':
        // 대기 결재 건수 업데이트
        pendingApprovalCount.value = data.count || 0;
        break;
        
      case 'approval_pending_count':
        // 새로운 형태의 대기 결재 건수 업데이트
        pendingApprovalCount.value = data.data?.count || 0;
        break;
        
      case 'new_approval_request':
        // 새로운 결재 요청 알림
        const newNotification = {
          id: Date.now(),
          type: 'new_request',
          title: '새로운 결재 요청',
          message: `${data.data.title} (${data.data.document_number})`,
          timestamp: new Date(),
          data: data.data
        };
        notifications.value.unshift(newNotification);
        
        // 브라우저 알림 (권한이 있는 경우)
        showBrowserNotification(newNotification);
        
        // 서버로부터 최신 카운트를 다시 가져옵니다 (안전성을 위해)
        refreshPendingCount();
        break;
        
      case 'approval_completed':
        // 결재 완료 알림
        const completedNotification = {
          id: Date.now(),
          type: 'completed',
          title: '결재 완료',
          message: `${data.data.title} 결재가 완료되었습니다.`,
          timestamp: new Date(),
          data: data.data
        };
        notifications.value.unshift(completedNotification);
        break;
        
      case 'approval_rejected':
        // 결재 반려 알림
        const rejectedNotification = {
          id: Date.now(),
          type: 'rejected',
          title: '결재 반려',
          message: `${data.data.title} 결재가 반려되었습니다.`,
          timestamp: new Date(),
          data: data.data
        };
        notifications.value.unshift(rejectedNotification);
        break;
        
      default:
    }
  };

  // 브라우저 알림 표시
  const showBrowserNotification = (notification) => {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: 'approval-notification'
      });
    }
  };

  // 알림 권한 요청
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // 대기 건수 새로고침
  const refreshPendingCount = () => {
    if (websocket.value?.readyState === WebSocket.OPEN) {
      websocket.value.send('get_pending_count');
    }
  };

  // 알림 제거
  const removeNotification = (notificationId) => {
    const index = notifications.value.findIndex(n => n.id === notificationId);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  };

  // 모든 알림 제거
  const clearAllNotifications = () => {
    notifications.value = [];
  };

  // WebSocket 연결 해제
  const disconnectWebSocket = () => {
    // ping interval 정리
    if (pingInterval.value) {
      clearInterval(pingInterval.value);
      pingInterval.value = null;
    }
    
    if (websocket.value) {
      websocket.value.close(1000, 'User disconnected');
      websocket.value = null;
      isConnected.value = false;
    }
  };

  // 계산된 속성
  const hasNotifications = computed(() => notifications.value.length > 0);
  const hasPendingApprovals = computed(() => pendingApprovalCount.value > 0);
  const recentNotifications = computed(() => notifications.value.slice(0, 5));

  return {
    // 상태
    pendingApprovalCount,
    isConnected,
    notifications,
    
    // 액션
    connectWebSocket,
    disconnectWebSocket,
    refreshPendingCount,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission,
    
    // 계산된 속성
    hasNotifications,
    hasPendingApprovals,
    recentNotifications,
  };
});