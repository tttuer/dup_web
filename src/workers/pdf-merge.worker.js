import { PDFDocument } from 'pdf-lib';

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

self.onmessage = async (e) => {
  const { id, files } = e.data;

  try {
    const mergedPdf = await PDFDocument.create();

    for (const { file_data } of files) {
      const byteArray = base64ToUint8Array(file_data);

      const donorPdf = await PDFDocument.load(byteArray, {
        ignoreEncryption: true, // ✅ 여전히 예외 방지를 위해 남김
      });

      const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    self.postMessage({ id, url: url });
  } catch (err) {
    console.error('PDF 병합 실패:', err);
    self.postMessage({ id, url: null, error: err.message });
  }
};
