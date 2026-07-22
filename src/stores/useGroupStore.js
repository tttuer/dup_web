// src/stores/group.js
import { ref } from 'vue';
import { authFetch } from '@/utils/authFetch';

export const groupOptions = ref([]);
export const groupNameToEnum = ref({});
export const groupIdToName = ref({}); // 추가된 부분
export const groupNameToId = ref({}); // 추가된 부분
export const groupHasUnreadChangesById = ref({});
const groupUrl = `${import.meta.env.VITE_GROUP_API_URL}`;

export async function loadGroupOptions(company = 'BAEKSUNG') {
  try {
    const res = await authFetch(`${groupUrl}?company=${company}`);
    const fetchedGroups = await res.json();

    groupOptions.value = fetchedGroups.map((group) => group.name);

    groupNameToEnum.value = fetchedGroups.reduce((acc, group) => {
      acc[group.name] = group.id;
      return acc;
    }, {});

    groupIdToName.value = fetchedGroups.reduce((acc, group) => {
      acc[group.id] = group.name;
      return acc;
    }, {});

    groupHasUnreadChangesById.value = fetchedGroups.reduce((acc, group) => {
      acc[group.id] = Boolean(group.has_unread_changes);
      return acc;
    }, {});

  } catch (error) {
    console.error('❌ 그룹 불러오기 실패:', error);
  }
}

export async function markGroupAsRead(groupId) {
  const response = await authFetch(`${groupUrl}/${groupId}/read`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error('폴더 확인 상태를 저장하지 못했습니다.');
  }

  groupHasUnreadChangesById.value = {
    ...groupHasUnreadChangesById.value,
    [groupId]: false,
  };
}
