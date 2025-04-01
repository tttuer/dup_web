export async function authFetch(url, options = {}) {
    const token = localStorage.getItem("access_token");
    const headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${token}`,
    };
  
    return fetch(url, {
      ...options,
      headers,
    });
  }
  