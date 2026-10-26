<template>
  <label class="inline-flex shrink-0 items-center gap-1 text-xs text-gray-600">
    <input
      type="checkbox"
      :checked="completed"
      :disabled="saving"
      :aria-label="`${fileName} 처리 완료 (나만 보기)`"
      class="h-4 w-4 accent-green-600"
      @change="changeCompletion"
    />
    {{ saving ? '저장 중…' : '처리 완료' }}
  </label>
</template>

<script setup>
const props = defineProps({
  fileName: String,
  completed: Boolean,
  saving: Boolean,
});
const emit = defineEmits(['change']);

function changeCompletion(event) {
  const completed = event.target.checked;
  event.target.checked = props.completed;
  emit('change', completed);
}
</script>
