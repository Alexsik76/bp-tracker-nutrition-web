<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  show: boolean;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close');
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.show) {
    emit('close');
  }
}

watch(() => props.show, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="props.show" class="modal-backdrop" @click="onBackdropClick">
        <div class="modal-content" role="dialog" aria-modal="true">
          <div class="modal-handle-bar">
            <div class="modal-drag-indicator"></div>
          </div>
          <div class="modal-header">
            <h3 class="modal-title">{{ props.title }}</h3>
            <button class="btn-icon close-btn" @click="emit('close')" aria-label="Закрити">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: var(--space-0);
  background-color: var(--color-modal-backdrop);
  backdrop-filter: blur(var(--blur-modal));
  -webkit-backdrop-filter: blur(var(--blur-modal));
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-content {
  width: 100%;
  max-width: var(--screen-max-width);
  background-color: var(--surface);
  border-top-left-radius: var(--radius-sheet);
  border-top-right-radius: var(--radius-sheet);
  border: var(--border-width-base) solid var(--surface-border);
  border-bottom: none;
  max-height: var(--modal-max-height);
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--space-16) + var(--safe-area-bottom));
  animation: slideUp var(--transition-sheet);
}

.modal-handle-bar {
  display: flex;
  justify-content: center;
  padding: var(--space-10) var(--space-0) var(--space-4);
}

.modal-drag-indicator {
  width: var(--sheet-drag-width);
  height: var(--sheet-drag-height);
  border-radius: var(--radius-xs);
  background-color: var(--color-drag-indicator);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-16) var(--space-12);
  border-bottom: var(--border-width-base) solid var(--surface-border);
}

.modal-title {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  color: var(--text-muted);
}

.modal-body {
  padding: var(--space-16);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: var(--space-12) var(--space-16) var(--space-0);
  border-top: var(--border-width-base) solid var(--surface-border);
  display: flex;
  gap: var(--space-12);
}

/* Animations */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-fade);
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
