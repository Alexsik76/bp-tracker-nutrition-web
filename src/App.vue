<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BottomNavBar from './components/BottomNavBar.vue';
import ToastContainer from './components/ToastContainer.vue';

const route = useRoute();

const isMainScreen = computed(() => {
  return route.path === '/' || route.path === '/menu';
});

const showBottomNav = computed(() => {
  return !isMainScreen.value && route.name !== 'login' && route.path !== '/login';
});
</script>

<template>
  <ToastContainer />
  <div class="app-container">
    <main class="app-content" :class="{ 'main-screen-layout': isMainScreen }">
      <router-view />
    </main>
    <BottomNavBar v-if="showBottomNav" />
  </div>
</template>

<style scoped>
.main-screen-layout {
  padding: 0;
  padding-bottom: var(--safe-area-bottom);
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
