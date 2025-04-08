<!-- components/PdfPreview.vue -->
<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps({
  fileData: String,
  fileName: String,
  fileId: String,
});

const pdfUrl = ref(null);
const previewUrlCache = new Map();
const objectUrls = new Map();

const worker = new Worker(new URL("./pdf-worker.js", import.meta.url), {
  type: "module",
});

worker.onmessage = (e) => {
  const { id, pdf_url } = e.data;
  previewUrlCache.set(id, pdf_url);
  if (id === props.fileId) {
    pdfUrl.value = pdf_url;
  }
};

function convertToBlobUrl(fileData, id) {
  try {
    const byteCharacters = atob(fileData);
    const byteArray = new Uint8Array(
      [...byteCharacters].map((c) => c.charCodeAt(0))
    );
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    objectUrls.set(id, url);
    return url;
  } catch (e) {
    console.error("PDF 변환 실패:", e);
    return null;
  }
}

onMounted(() => {
  if (previewUrlCache.has(props.fileId)) {
    pdfUrl.value = previewUrlCache.get(props.fileId);
  } else {
    const blobUrl = convertToBlobUrl(props.fileData, props.fileId);
    if (blobUrl) {
      pdfUrl.value = blobUrl;
      previewUrlCache.set(props.fileId, blobUrl);
    } else {
      worker.postMessage({ id: props.fileId, file_data: props.fileData });
    }
  }
});

onUnmounted(() => {
  for (const url of objectUrls.values()) {
    URL.revokeObjectURL(url);
  }
});
</script>

<template>
  <div class="group relative inline-block w-full">
    <a
      :href="`data:application/pdf;base64,${fileData}`"
      :download="fileName"
      class="truncate text-blue-500 hover:text-blue-600"
    >
      {{ fileName }}
    </a>
    <div
      class="pdf-preview absolute top-full left-0 z-10 mt-2 hidden h-80 w-64 border border-gray-300 bg-white p-2 shadow-lg group-hover:block"
    >
      <embed
        v-if="pdfUrl"
        :src="pdfUrl"
        type="application/pdf"
        class="h-full w-full"
      />
    </div>
  </div>
</template>
