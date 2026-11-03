<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ToastContainer from './components/ToastContainer.vue';

const route = useRoute();

const isMainScreen = computed(() => {
  return route.path === '/' || route.path === '/menu';
});
</script>

<template>
  <ToastContainer />
  <div class="app-container">
    <main class="app-content" :class="{ 'main-screen-layout': isMainScreen }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.main-screen-layout {
  padding: 0;
  padding-bottom: var(--safe-area-bottom);
  overflow: hidden;
  height: var(--screen-min-height);
  display: flex;
  flex-direction: column;
}
</style>
