const MODAL_SELECTOR = 'div.fixed.inset-0[class*="z-"]';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(modal) {
  return [...modal.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => element.getClientRects().length > 0,
  );
}

function closeModal(modal) {
  // Existing modals already close when their backdrop is clicked. Reusing that
  // path keeps Escape behavior consistent with each modal's own cleanup logic.
  modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

export default {
  install(app) {
    let activeModal = null;
    let previouslyFocusedElement = null;

    function decorateModal(modal) {
      if (modal.dataset.accessibleModal === 'true') return;

      modal.dataset.accessibleModal = 'true';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('tabindex', '-1');
    }

    function updateActiveModal() {
      const modals = [...document.querySelectorAll(MODAL_SELECTOR)];
      modals.forEach(decorateModal);
      const nextModal = modals.at(-1) || null;

      if (nextModal === activeModal) return;

      if (nextModal) {
        previouslyFocusedElement = document.activeElement;
        activeModal = nextModal;
        requestAnimationFrame(() => {
          const initialFocus = getFocusableElements(activeModal)[0] || activeModal;
          initialFocus.focus();
        });
        return;
      }

      activeModal = null;
      if (previouslyFocusedElement?.isConnected) previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }

    function handleKeydown(event) {
      if (!activeModal) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal(activeModal);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(activeModal);
      if (focusableElements.length === 0) {
        event.preventDefault();
        activeModal.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    app.mixin({
      mounted() {
        if (this.$root !== this) return;
        const observer = new MutationObserver(updateActiveModal);
        observer.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('keydown', handleKeydown);
        updateActiveModal();
        this.$modalAccessibilityObserver = observer;
      },
      beforeUnmount() {
        if (this.$root !== this) return;
        this.$modalAccessibilityObserver?.disconnect();
        document.removeEventListener('keydown', handleKeydown);
      },
    });
  },
};
