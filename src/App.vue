<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BottomNavBar from './components/BottomNavBar.vue';
import ToastContainer from './components/ToastContainer.vue';

const route = useRoute();

const showBottomNav = computed(() => {
  return route.name !== 'login' && route.path !== '/login';
});
</script>

<template>
  <ToastContainer />
  <div class="app-container">
    <main class="app-content">
      <router-view />
    </main>
    <BottomNavBar v-if="showBottomNav" />
  </div>
</template>

<style scoped>
</style>
