// src/stores/group.js
import { ref } from 'vue';
import { authFetch } from '@/utils/authFetch';

export const groupOptions = ref([]);
export const groupNameToEnum = ref({});
export const groupIdToName = ref({}); // 추가된 부분
export const groupNameToId = ref({}); // 추가된 부분
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

    groupNameToId.value = fetchedGroups.reduce((acc, group) => {
      acc[group.name] = group.id;
      return acc;
    }, {});
  } catch (error) {
    console.error('❌ 그룹 불러오기 실패:', error);
  }
}
