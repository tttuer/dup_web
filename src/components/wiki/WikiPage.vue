<template>
  <div class="flex h-full w-full bg-white">
    <!-- Sidebar -->
    <WikiTree 
      :publicTree="publicTree" 
      :personalTree="personalTree" 
      :selectedId="selectedPageId"
      @select="handleSelectPage"
      @create="handleCreatePage"
    />

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden relative border-l border-gray-200">
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- Editor Mode -->
        <WikiEditor 
          v-if="isEditing" 
          :initialData="editingData"
          :availableParents="validParentsForEdit"
          @save="handleSave"
          @cancel="handleCancelEdit"
        />

        <!-- Viewer Mode -->
        <WikiViewer 
          v-else-if="selectedPageData" 
          :page="selectedPageData"
          :breadcrumbs="breadcrumbs"
          @edit="handleEditPage"
          @delete="handleDeletePage"
          @navigate="handleSelectPageById"
        />

        <!-- Empty State -->
        <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-20 h-20 mb-6 text-gray-300">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p class="text-xl font-medium text-gray-600 mb-2">사내 위키에 오신 것을 환영합니다</p>
          <p class="text-sm text-gray-400">왼쪽 트리에서 문서를 선택하거나 '+' 버튼을 눌러 새 문서를 작성해보세요.</p>
        </div>
      </template>

      <!-- Delete Confirmation / Block Modal -->
      <div v-if="deleteModalOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="flex items-center mb-4" :class="descendantCount > 0 ? 'text-orange-600' : 'text-red-600'">
            <svg v-if="descendantCount > 0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 mr-2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <h3 class="text-xl font-bold">{{ descendantCount > 0 ? '삭제 불가 안내' : '문서 삭제' }}</h3>
          </div>
          
          <div class="text-gray-700 mb-6">
            <template v-if="descendantCount > 0">
              <p class="mb-3">이 문서 아래에 <strong>{{ descendantCount }}개</strong>의 하위 문서가 있어 삭제할 수 없습니다.</p>
              <div class="p-3 bg-orange-50 border border-orange-100 rounded-md text-sm text-orange-800">
                안전한 데이터 관리를 위해 하위 문서를 먼저 다른 곳으로 이동하거나 개별적으로 삭제해 주세요.
              </div>
            </template>
            <template v-else>
              <p><strong>"{{ selectedPageData?.title }}"</strong> 문서를 정말로 삭제하시겠습니까?</p>
              <p class="text-sm text-red-600 mt-2">이 작업은 되돌릴 수 없습니다.</p>
            </template>
          </div>
          
          <div class="space-y-2 flex flex-col gap-2">
            <button v-if="descendantCount === 0" @click="executeDelete" class="w-full px-4 py-2.5 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition">
              네, 삭제합니다
            </button>
            <button @click="deleteModalOpen = false" class="w-full px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 transition" :class="{ 'mt-2': descendantCount === 0 }">
              {{ descendantCount > 0 ? '확인' : '취소' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import WikiTree from './WikiTree.vue';
import WikiViewer from './WikiViewer.vue';
import WikiEditor from './WikiEditor.vue';
import { getWikiTree, getPersonalWiki, getWiki, createWiki, updateWiki, deleteWiki } from '@/api/wiki';
import { useToast } from 'vue-toastification';

const toast = useToast();

const publicTree = ref([]);
const personalTree = ref([]);
const selectedPageId = ref(null);
const selectedPageData = ref(null);
const isEditing = ref(false);
const editingData = ref(null); // { title, content, parent_id, is_personal }
const isLoading = ref(false);

const deleteModalOpen = ref(false);
const descendantCount = ref(0);

const buildTree = (flatList) => {
  const nodeMap = {};
  const rootNodes = [];

  flatList.forEach(item => {
    nodeMap[item.id] = { ...item, children: [] };
  });

  flatList.forEach(item => {
    if (item.parent_id && nodeMap[item.parent_id]) {
      nodeMap[item.parent_id].children.push(nodeMap[item.id]);
    } else {
      rootNodes.push(nodeMap[item.id]);
    }
  });

  return rootNodes;
};

const validParentsForEdit = computed(() => {
  const flat = [];
  const traverse = (nodes, prefix = '', isPersonal, skipId) => {
    nodes.forEach(n => {
      // 현재 수정 중인 문서(skipId)와 그 하위 문서들은 상위 폴더 선택지에서 제외
      if (n.id === skipId) return;
      flat.push({ id: n.id, title: prefix + n.title, is_personal: isPersonal });
      if (n.children) traverse(n.children, prefix + n.title + ' > ', isPersonal, skipId);
    });
  };
  traverse(publicTree.value, '', false, selectedPageId.value);
  traverse(personalTree.value, '', true, selectedPageId.value);
  return flat;
});

const loadTrees = async () => {
  try {
    const [pub, per] = await Promise.all([
      getWikiTree().catch(() => []),
      getPersonalWiki().catch(() => [])
    ]);
    publicTree.value = buildTree(pub);
    personalTree.value = buildTree(per);
  } catch (error) {
    console.error('Failed to load wiki trees', error);
  }
};

const breadcrumbs = computed(() => {
  if (!selectedPageData.value) return [];
  const isPersonal = selectedPageData.value.is_personal;
  const tree = isPersonal ? personalTree.value : publicTree.value;
  let path = [];
  
  const findPath = (nodes, targetId, currentPath) => {
    for (const node of nodes) {
      const newPath = [...currentPath, { id: node.id, title: node.title }];
      if (node.id === targetId) {
        path = newPath;
        return true;
      }
      if (node.children && findPath(node.children, targetId, newPath)) {
        return true;
      }
    }
    return false;
  };
  
  findPath(tree, selectedPageData.value.id, []);
  
  return [
    { id: null, title: isPersonal ? '개인 공간' : '공용 위키' },
    ...path
  ];
});

const handleSelectPageById = (id) => {
  if (!id) return;
  handleSelectPage({ id });
};

const handleSelectPage = async (node) => {
  if (isEditing.value) {
    if (!confirm('작성 중인 내용이 사라질 수 있습니다. 계속하시겠습니까?')) return;
  }
  
  isEditing.value = false;
  selectedPageId.value = node.id;
  isLoading.value = true;
  
  try {
    const data = await getWiki(node.id);
    selectedPageData.value = data;
  } catch (error) {
    toast.error('문서를 불러오는데 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
};

const handleCreatePage = (parentId = '') => {
  if (isEditing.value) {
    if (!confirm('작성 중인 내용이 사라질 수 있습니다. 계속하시겠습니까?')) return;
  }
  
  selectedPageId.value = null;
  selectedPageData.value = null;
  // If parentId is provided, figure out if it's personal from validParentsForEdit
  let isPersonal = false;
  if (parentId) {
    const parentNode = validParentsForEdit.value.find(n => n.id === parentId);
    if (parentNode) isPersonal = parentNode.is_personal;
  }
  
  editingData.value = { title: '', content: '', parent_id: parentId, is_personal: isPersonal };
  isEditing.value = true;
};

const handleEditPage = () => {
  if (!selectedPageData.value) return;
  
  editingData.value = { 
    title: selectedPageData.value.title, 
    content: selectedPageData.value.content,
    parent_id: selectedPageData.value.parent_id || '',
    is_personal: selectedPageData.value.is_personal || false
  };
  isEditing.value = true;
};

const handleCancelEdit = () => {
  isEditing.value = false;
  editingData.value = null;
  if (!selectedPageId.value) {
    selectedPageData.value = null;
  }
};

const handleSave = async (data) => {
  isLoading.value = true;
  try {
    if (selectedPageId.value) {
      // Update
      const res = await updateWiki(selectedPageId.value, data);
      selectedPageData.value = res;
      toast.success('문서가 수정되었습니다.');
    } else {
      // Create
      const res = await createWiki(data);
      selectedPageId.value = res.id;
      selectedPageData.value = res;
      toast.success('문서가 생성되었습니다.');
    }
    await loadTrees(); // Reload tree to show new page/updates
    isEditing.value = false;
  } catch (error) {
    toast.error('저장에 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
};

const countDescendants = (parentId) => {
  let count = 0;
  const countNodes = (nodes) => {
    if (!nodes) return 0;
    let sum = nodes.length;
    for (const n of nodes) sum += countNodes(n.children);
    return sum;
  };
  const findAndCount = (nodes) => {
    for (const n of nodes) {
      if (n.id === parentId) {
        count += countNodes(n.children);
        return true;
      }
      if (n.children && findAndCount(n.children)) return true;
    }
    return false;
  };
  
  findAndCount(publicTree.value) || findAndCount(personalTree.value);
  return count;
};

const handleDeletePage = () => {
  descendantCount.value = countDescendants(selectedPageId.value);
  deleteModalOpen.value = true;
};

const executeDelete = async () => {
  deleteModalOpen.value = false;
  isLoading.value = true;
  try {
    await deleteWiki(selectedPageId.value);
    toast.success('문서가 삭제되었습니다.');
    selectedPageId.value = null;
    selectedPageData.value = null;
    await loadTrees();
  } catch (error) {
    if (error.response?.status === 422 || error.message.includes('child')) {
      toast.error('하위 문서가 있는 문서는 삭제할 수 없습니다.');
    } else {
      toast.error('삭제에 실패했습니다.');
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadTrees();
});
</script>
