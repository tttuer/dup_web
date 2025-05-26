import { createRouter, createWebHistory } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

import HomeView from './components/lists/App.vue';
import ExtraView from './components/extra/App.vue';
import LoginView from './components/login/App.vue';

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
  const token = localStorage.getItem('access_token');

  let isAuthenticated = false;
  let roles = [];

  if (token) {
    try {
      const decoded = jwtDecode(token); // exp 포함된 payload 디코드
      const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)

      if (decoded.exp > currentTime) {
        isAuthenticated = true; // 아직 유효한 토큰
        roles = decoded.roles || []; // ✅ roles 추출
      }
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
      isAuthenticated = false;
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login';
  }

  // 인증은 되었지만 VOUCHER 권한 없으면 "/" 접근 금지
  if (to.path === '/' && !roles.includes('VOUCHER')) {
    return '/extra'; // ✅ 리다이렉트
  }

  return true;
});

export default router;
