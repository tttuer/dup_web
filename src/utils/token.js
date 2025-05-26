export function getRoleFromToken(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles;
    } catch (e) {
      console.error('토큰 디코딩 실패:', e);
      return null;
    }
  }
  
  export function getRoleFromLocalStorage() {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    return getRoleFromToken(token);
  }
  