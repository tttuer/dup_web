import { PDFDocument } from 'pdf-lib';

self.onmessage = async (e) => {
  const { id, files } = e.data;

  try {
    const mergedPdf = await PDFDocument.create();

    for (const { file_data } of files) {
      const byteCharacters = atob(file_data);
      const byteArray = new Uint8Array([...byteCharacters].map((c) => c.charCodeAt(0)));

      const donorPdf = await PDFDocument.load(byteArray);
      const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    self.postMessage({ id, merged_pdf_url: url });
  } catch (err) {
    self.postMessage({ id, merged_pdf_url: null, error: err.message });
  }
};
