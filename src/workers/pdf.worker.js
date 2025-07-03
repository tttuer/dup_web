// pdf-worker.js

self.onmessage = (e) => {
  const { id, file_data } = e.data;
  try {
    const byteCharacters = atob(file_data);
    const byteArray = new Uint8Array([...byteCharacters].map((c) => c.charCodeAt(0)));
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    self.postMessage({ id, url: url });
  } catch (err) {
    self.postMessage({ id, url: null, error: err.message });
  }
};
