<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { authFetch } from '@/utils/authFetch';

const toast = useToast();

const pendingUsers = ref([]);
const existingUsers = ref([]);
const loading = ref(false);
const existingUsersLoading = ref(false);
const deletingUserIds = ref(new Set());

const userApiUrl = `${import.meta.env.VITE_USER_API_URL}`;

const approvalStatuses = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

const roles = {
  ADMIN: 'ADMIN',
  VOUCHER: 'VOUCHER',
  USER: 'USER'
};

const roleLabels = {
  ADMIN: '관리자',
  VOUCHER: '전표 관리자',
  USER: '일반 사용자'
};

onMounted(() => {
  refreshUsers();
});

async function refreshUsers() {
  await Promise.all([
    fetchPendingUsers(),
    fetchExistingUsers()
  ]);
}

async function fetchPendingUsers() {
  try {
    loading.value = true;
    
    const response = await authFetch(`${userApiUrl}/pending`);

    if (response.ok) {
      const data = await response.json();
      pendingUsers.value = data.map(user => ({
        ...user,
        selectedRoles: [roles.USER] // 기본값으로 USER 역할 선택
      }));
    } else {
      toast.error('승인 대기 중인 사용자 목록을 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    toast.error('서버 오류가 발생했습니다.');
  } finally {
    loading.value = false;
  }
}

async function fetchExistingUsers() {
  try {
    existingUsersLoading.value = true;

    const response = await authFetch(userApiUrl);

    if (response.ok) {
      const data = await response.json();
      existingUsers.value = data
        .filter(user => user.approval_status !== approvalStatuses.PENDING)
        .sort((a, b) => (a.name || a.user_id).localeCompare(b.name || b.user_id, 'ko-KR'));
    } else {
      toast.error('기존 회원 목록을 불러오는데 실패했습니다.');
    }
  } catch (error) {
    console.error('기존 회원 목록 조회 오류:', error);
    toast.error('서버 오류가 발생했습니다.');
  } finally {
    existingUsersLoading.value = false;
  }
}

async function approveUser(userIdentifier, approvalStatus, userRoles) {
  try {
    const response = await authFetch(`${userApiUrl}/${userIdentifier}/approval`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approval_status: approvalStatus,
        roles: userRoles
      }),
    });

    if (response.ok) {
      const message = approvalStatus === approvalStatuses.APPROVED ? '승인되었습니다' : '거부되었습니다';
      toast.success(`사용자가 ${message}.`);
      
      // 목록 새로고침
      await refreshUsers();
    } else {
      const data = await response.json();
      toast.error(data.detail || '처리에 실패했습니다.');
    }
  } catch (error) {
    console.error('사용자 승인 오류:', error);
    toast.error('서버 오류가 발생했습니다.');
  }
}

async function deleteUser(user) {
  if (!window.confirm(`${user.name || user.user_id} 회원을 삭제하시겠습니까?`)) {
    return;
  }

  try {
    deletingUserIds.value = new Set(deletingUserIds.value).add(user.id);

    const response = await authFetch(`${userApiUrl}/${user.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      toast.success('회원이 삭제되었습니다.');
      await refreshUsers();
    } else {
      const data = await response.json();
      toast.error(data.detail || '회원 삭제에 실패했습니다.');
    }
  } catch (error) {
    console.error('회원 삭제 오류:', error);
    toast.error('서버 오류가 발생했습니다.');
  } finally {
    const nextDeletingUserIds = new Set(deletingUserIds.value);
    nextDeletingUserIds.delete(user.id);
    deletingUserIds.value = nextDeletingUserIds;
  }
}

function toggleRole(user, role) {
  const index = user.selectedRoles.indexOf(role);
  if (index > -1) {
    user.selectedRoles.splice(index, 1);
  } else {
    user.selectedRoles.push(role);
  }
  
  // 최소 하나의 역할은 선택되어야 함
  if (user.selectedRoles.length === 0) {
    user.selectedRoles.push(roles.USER);
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRoles(userRoles = []) {
  if (userRoles.length === 0) {
    return '역할 없음';
  }

  return userRoles.map(role => roleLabels[role] || role).join(', ');
}
</script>

<template>
  <div class="flex-1 p-8 overflow-y-auto bg-gray-50 h-full w-full">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">회원 승인 관리</h1>
      
      <section class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">승인 대기 회원</h2>
          <span class="text-sm text-gray-500">{{ pendingUsers.length }}명</span>
        </div>

        <div v-if="loading" class="text-center py-8 bg-white rounded-lg shadow">
          <div class="text-gray-500">로딩 중...</div>
        </div>
        
        <div v-else-if="pendingUsers.length === 0" class="text-center py-8 bg-white rounded-lg shadow">
          <div class="text-gray-500">승인 대기 중인 사용자가 없습니다.</div>
        </div>
        
        <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  아이디
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  요청일
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할 선택
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in pendingUsers" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ user.user_id }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ formatDate(user.updated_at || user.created_at) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-wrap gap-2">
                    <label 
                      v-for="(label, role) in roleLabels" 
                      :key="role"
                      class="inline-flex items-center"
                    >
                      <input
                        type="checkbox"
                        :checked="user.selectedRoles.includes(role)"
                        @change="toggleRole(user, role)"
                        class="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span class="ml-2 text-sm text-gray-700">{{ label }}</span>
                    </label>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <button
                      @click="approveUser(user.id, approvalStatuses.APPROVED, user.selectedRoles)"
                      class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      승인
                    </button>
                    <button
                      @click="approveUser(user.id, approvalStatuses.REJECTED, [])"
                      class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      거부
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">기존 회원</h2>
          <span class="text-sm text-gray-500">{{ existingUsers.length }}명</span>
        </div>

        <div v-if="existingUsersLoading" class="text-center py-8 bg-white rounded-lg shadow">
          <div class="text-gray-500">로딩 중...</div>
        </div>
        
        <div v-else-if="existingUsers.length === 0" class="text-center py-8 bg-white rounded-lg shadow">
          <div class="text-gray-500">등록된 기존 회원이 없습니다.</div>
        </div>
        
        <div v-else class="bg-white rounded-lg shadow overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  아이디
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in existingUsers" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ user.name || '-' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ user.user_id }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-700">{{ formatRoles(user.roles) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ formatDate(user.created_at) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="deleteUser(user)"
                    :disabled="deletingUserIds.has(user.id)"
                    class="bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
                  >
                    {{ deletingUserIds.has(user.id) ? '삭제 중' : '삭제' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
      <div class="mt-6">
        <button
          @click="refreshUsers"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          새로고침
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-checkbox {
  appearance: none;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  display: inline-block;
  flex-shrink: 0;
  height: 1rem;
  width: 1rem;
}

.form-checkbox:checked {
  background-color: #2563eb;
  border-color: #2563eb;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z'/%3e%3c/svg%3e");
}
</style>
