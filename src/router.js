import { createRouter, createWebHistory } from "vue-router";

import HomeView from "./components/lists/App.vue";
import LoginView from "./components/login/App.vue";

const routes = [
  { path: "/", component: HomeView, meta: { requiresAuth: true } },
  { path: "/login", component: LoginView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const isAuthenticated = !!localStorage.getItem("access_token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    return "/login";
  }

  return true;
});

export default router;
