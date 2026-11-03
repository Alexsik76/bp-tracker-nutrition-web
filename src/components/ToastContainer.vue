<script setup lang="ts">
import { useToastStore } from '../stores/toast';

const toastStore = useToastStore();
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
        @click="toastStore.dismiss(toast.id)"
      >
        <span class="toast-icon">
          <svg v-if="toast.type === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <svg v-else-if="toast.type === 'warning'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <svg v-else-if="toast.type === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(var(--space-16) + var(--safe-area-top));
  left: var(--space-0);
  right: var(--space-0);
  margin: var(--space-0) auto;
  max-width: var(--toast-max-width);
  padding: var(--space-0) var(--space-16);
  z-index: 300;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  border-radius: var(--radius-control);
  font-size: var(--toast-font-size);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  box-shadow: var(--shadow-toast);
  backdrop-filter: blur(var(--blur-toast));
}

.toast-success {
  background-color: var(--color-toast-success-bg);
  color: var(--color-toast-success-text);
  border: var(--border-width-base) solid var(--color-toast-success-border);
}

.toast-warning {
  background-color: var(--color-toast-warning-bg);
  color: var(--color-toast-warning-text);
  border: var(--border-width-base) solid var(--color-toast-warning-border);
}

.toast-danger, .toast-error {
  background-color: var(--color-toast-error-bg);
  color: var(--color-toast-error-text);
  border: var(--border-width-base) solid var(--color-toast-error-border);
}

.toast-info {
  background-color: var(--color-toast-info-bg);
  color: var(--color-toast-info-text);
  border: var(--border-width-base) solid var(--color-toast-info-border);
}

.toast-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
}

.toast-enter-active, .toast-leave-active {
  transition: all var(--transition-normal);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(calc(-1 * var(--space-16))) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(calc(-1 * var(--space-8))) scale(0.95);
}
</style>
