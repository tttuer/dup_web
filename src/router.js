import {createRouter, createWebHistory} from 'vue-router'

import HomeView from './components/lists/App.vue'
import LoginView from './components/login/App.vue'

const routes = [
    { path: '/', component: HomeView },
    { path: '/login', component: LoginView },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router