<!-- components/EditModal.vue -->
<template>
  <div
    v-if="visible"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @click="handleBackgroundClick"
    class="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-black/40"
  >
    <div class="w-[450px] rounded-lg bg-white p-6 shadow-sm" @click.stop>
      <h2 class="mb-4 text-lg font-semibold">권한 수정</h2>

      <!-- 설명 -->
      <div class="mb-4" v-if="group">
        <label class="block text-sm font-medium">그룹 이름</label>
        <input
          v-model="props.groupName"
          type="text"
          class="mt-1 w-full cursor-default rounded border border-gray-300 bg-gray-100 p-2 text-gray-600"
          readonly
        />
      </div>
      <div class="mb-4">
        <label v-for="user in group.auth_users" class="flex items-center space-x-1 pl-1">
          <span
            :class="{
              'text-red-500 line-through': deleteTargets.includes(user),
            }"
          >
            {{ user }}
          </span>
          <span v-if="deleteTargets.includes(user)">❌</span>
        </label>
        <label v-for="user in getNewUsers()" class="flex items-center space-x-1 pl-1">
          <span
            :class="{
              'text-red-500 line-through': deleteTargets.includes(user),
            }"
          >
            {{ user }}
          </span>
          <span v-if="deleteTargets.includes(user)">❌</span>
        </label>
      </div>

      <div class="flex justify-end space-x-2">
        <button
          @click="$emit('close')"
          class="cursor-pointer rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          취소
        </button>
        <button
          @click="save"
          class="cursor-pointer rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          수정
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, onMounted } from 'vue';
import { useCurrencyFormatter } from '@/utils/currencyFormatter';
import { getRoleFromLocalStorage } from '@/utils/token';
import { groupNameToEnum, loadGroupOptions } from '@/stores/group';
import { authFetch } from '@/utils/authFetch';

const groupUrl = `${import.meta.env.VITE_GROUP_API_URL}`;
const userUrl = `${import.meta.env.VITE_USER_API_URL}`;

const roles = ref(getRoleFromLocalStorage());
const params = new URLSearchParams();
const group = ref(null);
const users = ref([]);
const deleteTargets = ref([]); // 삭제할 file_name 목록

const props = defineProps({
  visible: Boolean,
  groupId: String,
  groupName: String,
  company: String,
});

const emit = defineEmits(['close', 'save']);

// 드래그 중 클릭 방지를 위한 상태
let isDragging = false;

async function fetchGroup() {
  params.append('id', props.groupId);

  try {
    const response = await authFetch(groupUrl + `/${props.groupId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      group.value = await response.json();
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchUsers() {
  try {
    const response = await authFetch(`${userUrl}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      users.value = await response.json();
    }
  } catch (err) {
    console.error(err);
  }
}

function getNewUsers() {
  return users.value.filter((user) => !group.value.auth_users.includes(user.username));
}

watch([() => props.visible, () => props.groupId], ([visible, groupId]) => {
  if (visible && groupId) {
    fetchGroup();
    fetchUsers();
  }
});

// watch(
//   () => props.visible,
//   (val) => {
//     if (val && props.file) {
//       form.id = props.file.id;
//       form.name = props.file.name;
//       form.withdrawn_at = props.file.withdrawn_at;
//       form.company = props.file.company;
//       form.lock = props.file.lock;
//       form.group_id = props.file.group_id;
//     }
//   },
// );

function handleFileChange(event) {
  newFile.value = event.target.files[0];
}
function handleMouseDown() {
  isDragging = false;
}

function handleMouseMove() {
  isDragging = true;
}

function handleBackgroundClick(event) {
  // 드래그로 인한 클릭은 무시
  if (isDragging) return;
  // 클릭한 대상이 이 배경 div 본인인 경우에만 닫기
  if (event.target === event.currentTarget) {
    emit('close');
  }
}

function save() {
  const payload = {
    ...form,
    file: newFile.value || null,
  };
  emit('save', payload);
}
</script>
