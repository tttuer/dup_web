import { ref, onUnmounted } from 'vue';

export function usePdfPreview(itemsRef, workerType) {
  const previewUrlCache = new Map();
  let worker;

  if (workerType === 'single') {
    worker = new Worker(new URL('../workers/pdf.worker.js', import.meta.url), {
      type: 'module',
    });
  } else if (workerType === 'merge') {
    worker = new Worker(new URL('../workers/pdf-merge.worker.js', import.meta.url), {
      type: 'module',
    });
  } else {
    console.error('Invalid workerType provided to usePdfPreview');
    return {};
  }

  worker.onmessage = (e) => {
    const { id, url } = e.data;
    previewUrlCache.set(id, url);
    const item = itemsRef.value.find((i) => i.id === id);
    if (item) {
      if (workerType === 'single') {
        item.pdf_url = url;
      } else if (workerType === 'merge') {
        item.merged_pdf_url = url;
      }
    }
  };

  function handlePreviewPosition(event) {
    const container = event.currentTarget;
    const preview = container.querySelector('.pdf-preview');
    if (!preview) return;

    const containerRect = container.getBoundingClientRect();
    const previewHeight = preview.offsetHeight || 600;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;

    preview.classList.remove('bottom-full', 'mb-2');
    preview.classList.add('top-full', 'mt-2');

    if (spaceBelow < previewHeight && spaceAbove > previewHeight) {
      preview.classList.remove('top-full', 'mt-2');
      preview.classList.add('bottom-full', 'mb-2');
    }
  }

  function resetPreviewPosition(event) {
    const container = event.currentTarget;
    const preview = container.querySelector('.pdf-preview');
    if (!preview) return;

    preview.classList.remove('bottom-full', 'mb-2');
    preview.classList.add('top-full', 'mt-2');
  }

  function generatePreview(item) {
    if (!previewUrlCache.has(item.id)) {
      if (workerType === 'single') {
        worker.postMessage({ id: item.id, file_data: item.file_data });
      } else if (workerType === 'merge') {
        const files = item.files || [];
        worker.postMessage({
          id: item.id,
          files: files.map(({ file_data }) => ({ file_data })),
        });
      }
    } else {
      if (workerType === 'single') {
        item.pdf_url = previewUrlCache.get(item.id);
      } else if (workerType === 'merge') {
        item.merged_pdf_url = previewUrlCache.get(item.id);
      }
    }
  }

  function clearPreviewCache(id) {
    previewUrlCache.delete(id);
  }

  onUnmounted(() => {
    if (worker) {
      worker.terminate();
    }
  });

  return { handlePreviewPosition, resetPreviewPosition, generatePreview, clearPreviewCache };
}