<script setup lang="ts">
defineProps<{
  totalKcal: number;
  eatenKcal: number;
  eatenSlotsCount: number;
  totalSlotsCount: number;
}>();
</script>

<template>
  <div class="summary-card card">
    <div class="summary-col">
      <span class="summary-label">Заплановано</span>
      <span class="summary-val num-mono">{{ totalKcal }} <span class="summary-unit">ккал</span></span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-col">
      <span class="summary-label">З'їдено</span>
      <span class="summary-val num-mono val-eaten">{{ eatenKcal }} <span class="summary-unit">ккал</span></span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-col">
      <span class="summary-label">Прийомів</span>
      <span class="summary-val num-mono">{{ eatenSlotsCount }} / {{ totalSlotsCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--space-12) var(--space-16);
  margin-bottom: var(--space-12);
  background: rgba(255, 255, 255, 0.03);
}

.summary-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-label {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-val {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.val-eaten {
  color: var(--success);
}

.summary-unit {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-muted);
}

.summary-divider {
  width: 1px;
  height: 24px;
  background-color: var(--surface-border);
}
</style>
