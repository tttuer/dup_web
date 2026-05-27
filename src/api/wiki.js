import { authFetch } from '@/utils/authFetch';

const wikiUrl = import.meta.env.VITE_WIKI_API_URL;

export async function getWikiTree() {
  const res = await authFetch(`${wikiUrl}/tree`);
  if (!res.ok) throw new Error('Failed to fetch wiki tree');
  return res.json();
}

export async function getPersonalWiki() {
  const res = await authFetch(`${wikiUrl}/personal`);
  if (!res.ok) throw new Error('Failed to fetch personal wiki');
  return res.json();
}

export async function getWiki(id) {
  const res = await authFetch(`${wikiUrl}/${id}`);
  if (!res.ok) throw new Error('Failed to fetch wiki content');
  return res.json();
}

export async function createWiki(data) {
  const res = await authFetch(wikiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create wiki');
  return res.json();
}

export async function updateWiki(id, data) {
  const res = await authFetch(`${wikiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update wiki');
  return res.json();
}

export async function deleteWiki(id) {
  const res = await authFetch(`${wikiUrl}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete wiki');
  return true;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await authFetch(`${wikiUrl}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}

export async function reorderWiki(items) {
  const res = await authFetch(`${wikiUrl}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error('Failed to reorder wiki');
  return res.json();
}

export async function uploadAttachment(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await authFetch(`${wikiUrl}/attachments/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload attachment');
  return res.json();
}
