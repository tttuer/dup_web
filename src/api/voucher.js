import { authFetch } from '@/utils/authFetch';

const voucherApiUrl = import.meta.env.VITE_VOUCHER_API_URL;

export async function downloadVoucherFiles(fileIds) {
  const response = await authFetch(`${voucherApiUrl}/files/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fileIds),
  });

  if (!response.ok) {
    throw new Error('첨부파일 다운로드에 실패했습니다.');
  }

  return response.blob();
}
