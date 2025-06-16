import { createRouter, createWebHistory } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

import HomeView from './components/lists/App.vue';
import ExtraView from './components/extra/App.vue';
import LoginView from './components/login/App.vue';
import { tryRefreshToken } from '@/utils/authFetch'; // 가정: 토큰 갱신 함수
import { authFetch } from './utils/authFetch';

const routes = [
  { path: '/', component: HomeView, meta: { requiresAuth: true } },
  { path: '/extra', component: ExtraView, meta: { requiresAuth: true } },
  { path: '/login', component: LoginView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  let token = localStorage.getItem('access_token');
  let isAuthenticated = false;
  let roles = [];

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (decoded.exp > currentTime) {
        isAuthenticated = true;
        roles = decoded.roles || [];
      } else {
        // ✅ access_token 만료됨 → refresh 시도
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          token = localStorage.getItem('access_token');
          const newDecoded = jwtDecode(token);
          isAuthenticated = true;
          roles = newDecoded.roles || [];
        } else {
          // ✅ refresh 실패 → access_token 삭제 후 login 이동
          localStorage.removeItem('access_token');
          await authFetch('/api/users/logout', {
            method: 'POST',
            credentials: 'include', // 쿠키 전송
          });
          // refresh도 실패 → 로그인 페이지로
          return '/login';
        }
      }
    } catch (err) {
      console.error('토큰 에러:', err);
      return '/login';
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login';
  }

  if (to.path === '/' && !roles.includes('VOUCHER')) {
    return '/extra';
  }

  return true;
});

export default router;
