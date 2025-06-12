const userUrl = `${import.meta.env.VITE_USER_API_URL}`;

export async function authFetch(url, options = {}) {
  let token = localStorage.getItem('access_token');

  const fetchWithAuth = async () => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // ✅ refresh_token 쿠키 전송
    });

    // ✅ access_token 만료 시 → /refresh 요청
    if (res.status === 401 && !options._retry) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        token = localStorage.getItem('access_token'); // 새 토큰으로 갱신
        return authFetch(url, { ...options, _retry: true }); // 한 번만 재시도
      } else {
        localStorage.removeItem('access_token'); // 토큰 삭제
        window.location.href = '/login';
      }
    }

    return res;
  };

  return fetchWithAuth();
}

// ✅ refresh_token으로 access_token 재발급 시도
export async function tryRefreshToken() {
  try {
    const res = await fetch(`${userUrl}/refresh`, {
      method: 'POST',
      credentials: 'include', // ✅ 쿠키 전송 필수
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    return true;
  } catch (err) {
    console.error('토큰 재발급 실패:', err);
    return false;
  }
}
