<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

interface NavItem {
  name: string;
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    name: 'menu',
    path: '/menu',
    label: 'Меню',
    icon: 'calendar',
  },
  {
    name: 'dishes',
    path: '/dishes',
    label: 'Страви',
    icon: 'pot',
  },
  {
    name: 'products',
    path: '/products',
    label: 'Продукти',
    icon: 'carrot',
  },
  {
    name: 'profile',
    path: '/profile',
    label: 'Профіль',
    icon: 'user',
  },
];

function navigate(path: string) {
  router.push(path);
}
</script>

<template>
  <nav class="bottom-nav">
    <div class="nav-inner">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-tab"
        :class="{ active: route.path.startsWith(item.path) }"
        @click="navigate(item.path)"
        :aria-label="item.label"
      >
        <span class="nav-icon">
          <!-- Calendar / Menu icon -->
          <svg v-if="item.icon === 'calendar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>

          <!-- Pot / Dish icon -->
          <svg v-else-if="item.icon === 'pot'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 11h16a1 1 0 0 1 1 1v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-6a1 1 0 0 1 1-1z"></path>
            <path d="M3 11V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="4" x2="14" y2="4"></line>
            <line x1="12" y1="4" x2="12" y2="7"></line>
          </svg>

          <!-- Carrot / Products icon -->
          <svg v-else-if="item.icon === 'carrot'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7zM15 9l6-6M18 3l3 3M15 3h6v6"></path>
          </svg>

          <!-- User icon -->
          <svg v-else-if="item.icon === 'user'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--nav-bar);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--surface-border);
  z-index: 100;
  display: flex;
  justify-content: center;
}

.nav-inner {
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-bottom: var(--safe-area-bottom);
  height: calc(58px + var(--safe-area-bottom));
}

.nav-tab {
  flex: 1;
  height: 58px;
  min-height: var(--touch-target-min);
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s ease, transform 0.1s ease;
  padding: 0;
}

.nav-tab:active {
  transform: scale(0.95);
}

.nav-tab.active {
  color: var(--primary);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
