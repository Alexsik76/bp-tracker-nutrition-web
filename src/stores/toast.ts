import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([]);
  let counter = 0;

  function show(message: string, type: ToastType = 'info', timeoutMs = 3500) {
    const id = ++counter;
    toasts.value.push({ id, message, type });

    setTimeout(() => {
      dismiss(id);
    }, timeoutMs);
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    show,
    dismiss,
  };
});
