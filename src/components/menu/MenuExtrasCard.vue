<script setup lang="ts">
defineProps<{
  rationale?: string;
  shoppingList?: string[];
}>();
</script>

<template>
  <div v-if="rationale || (shoppingList && shoppingList.length > 0)" class="extras-section">
    <!-- Rationale card -->
    <div v-if="rationale" class="card rationale-card">
      <div class="section-header">
        <span>Обґрунтування ШІ</span>
      </div>
      <p class="rationale-text">{{ rationale }}</p>
    </div>

    <!-- Shopping list card -->
    <div v-if="shoppingList && shoppingList.length > 0" class="card shopping-card">
      <div class="section-header">
        <span>Рекомендації докупити</span>
      </div>
      <ul class="shopping-list">
        <li v-for="(item, idx) in shoppingList" :key="idx" class="shopping-item">
          <span class="shopping-bullet">•</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.extras-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-16);
}

.rationale-text {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.45;
}

.shopping-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.shopping-item {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: 13.5px;
  color: var(--text-primary);
}

.shopping-bullet {
  color: var(--warning);
}
</style>
