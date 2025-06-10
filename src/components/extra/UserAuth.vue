<script setup>
import UserAuthModal from '@/components/extra/UserAuthModal.vue';
import { useToast } from 'vue-toastification';

import { ref, watch } from 'vue';
import { getRoleFromLocalStorage } from '@/utils/token';

const roles = ref(getRoleFromLocalStorage());

const groupUrl = `${import.meta.env.VITE_GROUP_API_URL}`;
const toast = useToast();
const isEditModalOpen = ref(false);
const editTargetFile = ref(null);
const props = defineProps({
  groupId: {
    type: String,
    required: true,
  },
  groupName: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
});

function openEditModal() {
  // editTargetFile.value = file;
  isEditModalOpen.value = true;
}

function closeEditModal() {
  isEditModalOpen.value = false;
  editTargetFile.value = null;
}

async function editFile(payload) {
  // const formData = new FormData();
  // formData.append('name', payload.name);
  // formData.append('price', payload.price);
  // formData.append('withdrawn_at', payload.withdrawn_at);
  // formData.append('lock', payload.lock);
  // formData.append('group_id', payload.group_id);
  // if (payload.file) {
  //   formData.append('file_data', payload.file);
  // }
  // try {
  //   const response = await authFetch(`${fileUrl}/${payload.id}`, {
  //     method: 'PUT',
  //     body: formData,
  //   });
  //   if (response.ok) {
  //     toast.success('수정 완료');
  //     closeEditModal();
  //     fetchFiles(true);
  //   } else {
  //     toast.error('수정 실패');
  //   }
  // } catch (e) {
  //   toast.error('수정 중 오류 발생');
  //   console.error(e);
  // }
}
</script>

<template>
  <div class="group flex flex-row" v-if="roles.includes('ADMIN')">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-6 cursor-pointer text-gray-500 transition-colors duration-150 group-hover:text-blue-500"
      @click="openEditModal()"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
      />
    </svg>
    <UserAuthModal
      :visible="isEditModalOpen"
      :groupId="props.groupId"
      :groupName="props.groupName"
      :company="props.company"
      @close="closeEditModal"
      @save="editFile"
    />
  </div>
</template>

<style lang="scss" scoped></style>
