<script setup>
import { ref, watch } from 'vue';
import { authFetch } from '@/utils/authFetch'; // 백엔드 요청에 사용
import { Plus } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import UserAuth from '@/components/extra/UserAuth.vue';
import GroupDelete from './GroupDelete.vue';

const selected = ref('선택');
const isOpen = ref(false);
const newGroupName = ref('');
const groupUrl = `${import.meta.env.VITE_GROUP_API_URL}`;
const toast = useToast();

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  nameToEnum: {
    type: Object,
    required: true,
  },
  placeholder: {
    type: String,
    default: '선택',
  },
  modelValue: {
    type: String,
    default: '',
  },
  isGroupDropdown: {
    type: Boolean,
    default: false,
  },
  company: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'select', 'group-created', 'group-deleted']);

const selectOption = (option) => {
  selected.value = option;
  isOpen.value = false;
  emit('update:modelValue', props.nameToEnum[option]);
  emit('select', props.nameToEnum[option]);
};

const createGroup = async () => {
  const name = newGroupName.value.trim();
  if (!name) return;

  try {
    const res = await authFetch(`${groupUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, company: props.company }),
    });

    if (res.ok) {
      newGroupName.value = '';
      isOpen.value = false;
      emit('group-created');
      toast.success('그룹이 생성되었습니다.');
    } else if (res.status === 409) {
      toast.error('이미 존재하는 그룹 이름입니다.');
    } else {
      console.error('❌ 그룹 생성 실패');
    }
  } catch (err) {
    console.error('❌ 네트워크 오류:', err);
  }
};

// modelValue가 바뀌면 selected도 바뀌도록
watch(
  () => props.modelValue,
  (newValue) => {
    const found = Object.entries(props.nameToEnum).find(([name, id]) => id === newValue);
    selected.value = found ? found[0] : props.placeholder;
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex-none">
    <div class="relative z-50 mb-2 inline-block text-left">
      <button
        type="button"
        class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
        @click="isOpen = !isOpen"
      >
        {{ selected }}
        <svg class="-mr-1 size-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <!-- 드롭다운 박스 -->
      <div
        v-show="isOpen"
        class="absolute left-0 z-10 mt-2 w-full min-w-max origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5"
      >
        <div class="flex max-h-60 flex-col overflow-y-auto">
          <!-- ✅ 항상 위에 고정되는 그룹 추가 입력 -->
          <div v-if="props.isGroupDropdown" class="sticky top-0 z-10 rounded-md bg-white px-2 py-1">
            <div class="flex items-center">
              <input
                v-model="newGroupName"
                type="text"
                placeholder="새 그룹 이름"
                class="w-35 border-b border-gray-400 px-2 py-1 text-sm text-gray-700 focus:ring-0 focus:outline-none"
              />
              <button
                @click="createGroup"
                class="ml-1 cursor-pointer rounded border border-gray-300 px-2 py-1 text-sm text-black hover:bg-blue-500"
              >
                <Plus class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- 옵션 리스트 -->
          <div
            v-for="(option, index) in options"
            :key="index"
            class="block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            @click="selectOption(option)"
          >
            <div class="flex items-center justify-between">
              <span>{{ option }} </span>
              <div class="ml-auto flex items-center space-x-2">
                <GroupDelete
                  v-if="isGroupDropdown"
                  class="inline-block"
                  :groupId="nameToEnum[option]"
                  :groupName="option"
                  @click.stop="console.log('Delete clicked: ', option)"
                  @group-deleted="(deletedGroupId) => emit('group-deleted', deletedGroupId)"
                />
                <UserAuth
                  v-if="isGroupDropdown"
                  class="inline-block"
                  :groupId="nameToEnum[option]"
                  :groupName="option"
                  :company="props.company"
                  @click.stop="console.log('Auth clicked: ', option)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
