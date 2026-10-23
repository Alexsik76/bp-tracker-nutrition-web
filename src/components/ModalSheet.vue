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
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  background-color: var(--surface);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border: 1px solid var(--surface-border);
  border-bottom: none;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(var(--space-16) + var(--safe-area-bottom));
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-handle-bar {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
}

.modal-drag-indicator {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-16) var(--space-12);
  border-bottom: 1px solid var(--surface-border);
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
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
  padding: var(--space-12) var(--space-16) 0;
  border-top: 1px solid var(--surface-border);
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
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
