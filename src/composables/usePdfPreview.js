
import { ref, onUnmounted } from 'vue';

export function usePdfPreview(fileLists) {
  const previewUrlCache = new Map();
  const worker = new Worker(new URL('../components/extra/pdf-worker.js', import.meta.url), {
    type: 'module',
  });

  worker.onmessage = (e) => {
    const { id, pdf_url } = e.data;
    previewUrlCache.set(id, pdf_url);
    const file = fileLists.value.find((f) => f.id === id);
    if (file) {
      file.pdf_url = pdf_url;
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

  function generatePdfPreview(file) {
      if (!previewUrlCache.has(file.id)) {
        worker.postMessage({ id: file.id, file_data: file.file_data });
      } else {
        file.pdf_url = previewUrlCache.get(file.id);
      }
  }
  
  function generateVoucherPdfPreview(voucher) {
      if (!previewUrlCache.has(voucher.id)) {
        const files = voucher.files || [];
        worker.postMessage({
          id: voucher.id,
          files: files.map(({ file_data }) => ({ file_data })),
        });
      } else {
        voucher.merged_pdf_url = previewUrlCache.get(voucher.id);
      }
  }

  onUnmounted(() => {
    worker.terminate();
  });

  return { handlePreviewPosition, resetPreviewPosition, generatePdfPreview, generateVoucherPdfPreview };
}
