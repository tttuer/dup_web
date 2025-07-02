
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function useFileDownloader() {
  function downloadAllFiles(files, id = '') {
    const zip = new JSZip();
    const nameCount = {};

    files.forEach((file) => {
      let name = file.file_name || `file-${Date.now()}.pdf`;
      if (nameCount[name] === undefined) {
        nameCount[name] = 0;
      } else {
        nameCount[name]++;
        const extIdx = name.lastIndexOf('.');
        if (extIdx > 0) {
          name = name.slice(0, extIdx) + `(${nameCount[name]})` + name.slice(extIdx);
        } else {
          name = name + `(${nameCount[name]})`;
        }
      }

      const binary = atob(file.file_data);
      const byteArray = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
      zip.file(name, byteArray);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const filename = id ? `${id}.zip` : '첨부파일.zip';
      saveAs(content, filename);
    });
  }

  return { downloadAllFiles };
}
