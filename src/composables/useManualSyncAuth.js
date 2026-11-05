import { onUnmounted, ref } from 'vue';
import { authFetch } from '@/utils/authFetch';

export function useManualSyncAuth() {
  const status = ref('');
  const remaining = ref(0);
  const error = ref('');
  const sending = ref(false);
  const endpoint = `${import.meta.env.VITE_VOUCHER_API_URL}/sync/auth`;
  let requestId = '';
  let timer;
  let pollController;

  async function poll(id) {
    try {
      pollController = new AbortController();
      const response = await authFetch(`${endpoint}/${id}`, { signal: pollController.signal });
      if (!response.ok || requestId !== id) return;
      const state = await response.json();
      if (requestId !== id) return;
      if (['verifying', 'cancelled'].includes(status.value) && state.status === 'waiting') return;
      status.value = state.status;
      remaining.value = Math.max(0, Math.ceil((state.expires_at ?? 0) - Date.now() / 1000));
    } catch (cause) {
      if (cause.name !== 'AbortError' && requestId === id) {
        error.value = '연결 상태를 확인해주세요. 인증 대기 상태를 다시 확인하고 있습니다.';
      }
    } finally {
      if (requestId === id) timer = setTimeout(() => poll(id), 1500);
    }
  }

  function finish() {
    requestId = '';
    clearTimeout(timer);
    pollController?.abort();
    status.value = '';
    error.value = '';
    sending.value = false;
  }

  function begin() {
    finish();
    requestId = crypto.randomUUID();
    status.value = 'connecting';
    const id = requestId;
    timer = setTimeout(() => poll(id), 1000);
    return id;
  }

  async function send(method, code) {
    if (!requestId || sending.value || status.value !== 'waiting') return;
    const id = requestId;
    sending.value = true;
    error.value = '';
    try {
      const response = await authFetch(`${endpoint}/${id}`, {
        method,
        ...(code && {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(typeof body?.detail === 'string' ? body.detail : '인증 요청을 처리하지 못했습니다.');
      }
      if (requestId === id) status.value = method === 'DELETE' ? 'cancelled' : 'verifying';
    } catch (cause) {
      if (requestId === id) error.value = cause.message;
    } finally {
      if (requestId === id) sending.value = false;
    }
  }

  onUnmounted(finish);
  return { status, remaining, error, sending, begin, finish,
    submit: (code) => send('POST', code), cancel: () => send('DELETE') };
}
