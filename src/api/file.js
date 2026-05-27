import { authFetch } from '@/utils/authFetch';

const fileApiUrl = import.meta.env.VITE_FILE_API_URL;

export async function fetchFileById(id) {
  const response = await authFetch(`${fileApiUrl}/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch file');
  }
  return response.json();
}

export async function downloadBulkFiles(ids) {
  const response = await authFetch(`${fileApiUrl}/bulk-download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ids),
  });
  
  if (!response.ok) {
    throw new Error('Failed to download files');
  }
  
  return response.blob();
}
