<script setup>
import { ref, watch } from 'vue';

const props = defineProps({ status: String, remaining: Number, error: String, sending: Boolean });
const emit = defineEmits(['submit', 'cancel']);
const dialog = ref(null);
const code = ref('');

watch([() => props.status, dialog], ([status, element]) => {
  if (!element) return;
  if (['waiting', 'verifying', 'cancelled'].includes(status)) {
    if (!element.open) {
      code.value = '';
      element.showModal();
    }
    if (status !== 'waiting') code.value = '';
  } else if (element.open) {
    element.close();
    code.value = '';
  }
}, { flush: 'post' });
</script>

<template>
  <dialog
    ref="dialog"
    aria-labelledby="whg-email-title"
    class="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-6 text-gray-900 shadow-lg backdrop:bg-black/40"
    @cancel.prevent="status === 'waiting' && !sending && emit('cancel')"
  >
    <h2 id="whg-email-title" class="text-lg font-semibold">위하고 이메일 인증</h2>
    <form v-if="status === 'waiting'" @submit.prevent="emit('submit', code)">
      <p class="mt-3 text-sm">방금 입력한 위하고 계정에 연결된 이메일로 인증 메일을 보냈습니다. 메일에서 확인한 6자리 번호를 입력해주세요.</p>
      <p class="mt-2 text-sm text-gray-600">남은 시간 약 {{ remaining }}초 · 메일이 없다면 스팸함도 확인해주세요.</p>
      <label for="whg-email-code" class="mt-5 block text-sm font-medium">인증 번호</label>
      <input
        id="whg-email-code"
        :value="code"
        @input="code = $event.target.value.replace(/[^0-9]/g, '').slice(0, 6)"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="6"
        pattern="[0-9]{6}"
        required
        autofocus
        :disabled="sending"
        class="mt-2 w-full rounded border border-gray-300 p-3 text-center text-2xl tracking-widest"
      />
      <p v-if="error" role="alert" class="mt-3 text-sm text-red-600">{{ error }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" :disabled="sending" class="rounded bg-gray-200 px-4 py-2" @click="emit('cancel')">취소</button>
        <button type="submit" :disabled="sending || code.length !== 6 || remaining === 0" class="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
          {{ sending ? '전달 중…' : '인증하고 동기화 계속' }}
        </button>
      </div>
    </form>
    <p v-else role="status" class="mt-4 text-sm">{{ status === 'cancelled' ? '동기화를 취소하고 있습니다.' : '위하고 인증을 확인하고 동기화를 이어가고 있습니다.' }}</p>
  </dialog>
</template>
