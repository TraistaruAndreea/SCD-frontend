import { createRouter, createWebHistory } from 'vue-router';

import DashboardView from './views/DashboardView.vue';
import LoginView from './views/LoginView.vue';
import WriteView from './views/WriteView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/write', name: 'write', component: WriteView }
  ]
});

export default router;
