
import { saveAs } from 'file-saver';
import { downloadBulkFiles, fetchFileById } from '@/api/file';

function getFileId(file) {
  return file?.id ?? file?.file_id ?? file?.fileId;
}

export function useFileDownloader() {
  async function downloadAllFiles(files, id = '') {
    if (!files || files.length === 0) return;
    
    try {
      const ids = files.map(getFileId).filter((fileId) => fileId !== undefined && fileId !== null);
      if (ids.length === 0) {
        throw new Error('다운로드할 파일 ID가 없습니다.');
      }

      // 1. 단일 파일인 경우 처리 (선택사항이지만 단일 파일도 API로 받을 수 있음)
      if (files.length === 1) {
        // 단일 파일 다운로드도 bulk API를 사용해도 무방하며 ZIP으로 받을 수 있습니다.
        // 또는 단일 파일을 개별로 받아 원본 포맷으로 다운받게 할 수도 있습니다.
        // 여기서는 기존 로직과 동일하게 다중/단일 모두 bulk API를 사용해 ZIP으로 받도록 구성합니다.
        // 원본 다운로드를 원한다면 fetchFileById를 사용할 수 있습니다.
        
        // 원본 그대로 다운받기:
        const fileObj = await fetchFileById(ids[0]);
        if (fileObj.file_data) {
          const binary = atob(fileObj.file_data);
          const byteArray = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
          const blob = new Blob([byteArray], { type: 'application/octet-stream' });
          const filename = fileObj.file_name || `file-${Date.now()}`;
          saveAs(blob, filename);
          return;
        }
      }

      // 2. 여러 파일인 경우 (또는 ZIP 다운로드)
      const blob = await downloadBulkFiles(ids);
      const filename = id ? `${id}.zip` : '첨부파일.zip';
      saveAs(blob, filename);

    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  }

  return { downloadAllFiles };
}
