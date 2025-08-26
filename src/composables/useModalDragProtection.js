// src/composables/useModalDragProtection.js
import { ref } from 'vue';

export function useModalDragProtection() {
  const isTextSelecting = ref(false);
  const isDragging = ref(false);
  const isMouseDown = ref(false);
  const dragJustEnded = ref(false);

  // 텍스트 선택 시작 핸들러
  const handleSelectStart = (event) => {
    isTextSelecting.value = true;
  };

  // 드래그 시작 핸들러 
  const handleDragStart = (event) => {
    isDragging.value = true;
  };

  // 마우스 다운 핸들러
  const handleMouseDown = (event) => {
    isMouseDown.value = true;
    
    const target = event.target;
    
    // 입력 필드에서 마우스 다운 시 텍스트 선택 가능성 있음
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      
      // 전역 mousemove 리스너로 드래그 감지
      const handleGlobalMouseMove = (e) => {
        if (isMouseDown.value) {
          isTextSelecting.value = true;
          isDragging.value = true;
        }
      };
      
      const handleGlobalMouseUp = () => {
        const wasTextSelecting = isTextSelecting.value;
        const wasDragging = isDragging.value;
        
        isMouseDown.value = false;
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        
        // 드래그나 텍스트 선택이 있었다면 잠시 동안 드래그 종료 상태로 표시
        if (wasTextSelecting || wasDragging) {
          dragJustEnded.value = true;
          
          // 아주 짧은 시간 후 드래그 종료 상태 해제
          setTimeout(() => {
            dragJustEnded.value = false;
          }, 50);
        }
        
        // 지연 후 상태 초기화 (드래그 완료 대기)
        setTimeout(() => {
          if (!window.getSelection().toString()) {
            isTextSelecting.value = false;
            isDragging.value = false;
          }
        }, 150);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return;
    }

    // 드래그 가능한 요소 확인
    const draggableElement = target.closest('[data-draggable="true"]') || 
                            target.closest('.draggable') ||
                            target.closest('[draggable="true"]');
    
    if (draggableElement) {
      isDragging.value = true;
    }
  };

  // 마우스 업 핸들러
  const handleMouseUp = () => {
    const wasTextSelecting = isTextSelecting.value;
    const wasDragging = isDragging.value;
    
    isMouseDown.value = false;
    
    // 드래그나 텍스트 선택이 있었다면 잠시 동안 드래그 종료 상태로 표시
    if (wasTextSelecting || wasDragging) {
      dragJustEnded.value = true;
      setTimeout(() => {
        dragJustEnded.value = false;
      }, 50);
    }
    
    // 즉시 상태 초기화하지 않고 약간의 지연
    setTimeout(() => {
      const hasSelectedText = window.getSelection().toString().length > 0;
      if (!hasSelectedText) {
        isTextSelecting.value = false;
        isDragging.value = false;
      }
    }, 50);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    const wasDragging = isDragging.value;
    isDragging.value = false;
    isMouseDown.value = false; // Also reset isMouseDown
    
    if (wasDragging) {
      dragJustEnded.value = true;
      setTimeout(() => {
        dragJustEnded.value = false;
      }, 50);
    }
  };

  // 배경 클릭 핸들러
  const handleBackdropClick = (event, closeCallback) => {
    // self 클릭인지 먼저 확인 (자식 요소 클릭이 아닌 경우만)
    if (event.target !== event.currentTarget) {
      return;
    }
    
    // 현재 드래그/텍스트 선택 중이거나, 방금 드래그가 끝난 직후인 경우 모달 닫기 방지
    if ((isTextSelecting.value && isMouseDown.value) || 
        (isDragging.value && isMouseDown.value) ||
        dragJustEnded.value) {
      return;
    }
    
    closeCallback();
  };

  // 전역 이벤트 리스너 추가
  const addGlobalDragListeners = () => {
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart); 
    document.addEventListener('dragend', handleDragEnd);
  };

  const removeGlobalDragListeners = () => {
    document.removeEventListener('selectstart', handleSelectStart);
    document.removeEventListener('dragstart', handleDragStart);
    document.removeEventListener('dragend', handleDragEnd);
  };

  return {
    isTextSelecting,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleDragEnd,
    handleBackdropClick,
    addGlobalDragListeners,
    removeGlobalDragListeners,
  };
}