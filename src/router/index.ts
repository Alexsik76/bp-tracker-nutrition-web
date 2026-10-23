import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/menu',
    },
    {
      path: '/menu',
      name: 'menu',
      component: () => import('../views/MenuView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dishes',
      name: 'dishes',
      component: () => import('../views/DishesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/menu',
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (authStore.status === 'idle') {
    await authStore.initAuth();
  }

  const isAuthenticated = authStore.status === 'authenticated';

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { path: '/login', query: to.fullPath !== '/menu' ? { redirect: to.fullPath } : undefined };
  }
  if (to.meta.guest && isAuthenticated) {
    return { path: '/menu' };
  }
});

export default router;
