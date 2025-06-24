<script setup>
import { useToast } from 'vue-toastification';
import { authFetch } from '@/utils/authFetch';

import { ref } from 'vue';
import GroupDeleteModal from '@/components/extra/GroupDeleteModal.vue';

const groupUrl = `${import.meta.env.VITE_GROUP_API_URL}`;
const toast = useToast();
const isModalOpen = ref(false);
const editTargetFile = ref(null);
const emit = defineEmits(['group-deleted']);

const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  },
});

function openModal() {
  // editTargetFile.value = file;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editTargetFile.value = null;
}

async function deleteGroup() {
  try {
    const response = await authFetch(`${groupUrl}/${props.groupId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      toast.success(`${props.groupName} 삭제 완료`);
      emit('group-deleted');
      closeModal();
    } else {
      if (response.status === 403) {
        toast.error('권한이 없습니다');
      } else if (response.status === 404) {
        toast.error('그룹을 찾을 수 없습니다');
      } else {
        toast.error('그룹 삭제 실패');
      }
    }
  } catch (error) {
    console.error(error);
    toast.error('그룹 삭제 중 오류 발생');
  }
}
</script>

<template>
  <div class="group flex flex-row">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-6 cursor-pointer text-gray-500 transition-colors duration-150 group-hover:text-red-500"
      @click="openModal()"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>

    <GroupDeleteModal
      :visible="isModalOpen"
      :groupId="props.groupId"
      :groupName="props.groupName"
      @close="closeModal"
      @save="deleteGroup"
    />
  </div>
</template>

<style lang="scss" scoped></style>
