<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import { useToastStore } from '../../stores/toast';

const props = defineProps<{
  show: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: { text: string; kcal_est: number | null }): void;
}>();

const toastStore = useToastStore();

const offPlanText = ref('');
const offPlanKcal = ref<number | null>(null);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      offPlanText.value = '';
      offPlanKcal.value = null;
    }
  }
);

function handleSubmit() {
  if (!offPlanText.value.trim()) {
    toastStore.show('Вкажіть, що було зʼїдено', 'warning');
    return;
  }

  emit('save', {
    text: offPlanText.value.trim(),
    kcal_est: offPlanKcal.value ? Number(offPlanKcal.value) : null,
  });
}
</script>

<template>
  <ModalSheet
    :show="show"
    title="Запис поза планом"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="offplan-form">
      <div class="form-group">
        <label class="form-label" for="opText">Що було з'їдено?</label>
        <input
          id="opText"
          v-model="offPlanText"
          type="text"
          class="form-input"
          placeholder="Горіхи 30 г, банан, кава з молоком..."
          required
          autofocus
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="opKcal">Оцінка калорій (ккал)</label>
        <input
          id="opKcal"
          v-model.number="offPlanKcal"
          type="number"
          class="form-input num-mono"
          placeholder="Необов'язково"
          min="0"
        />
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving"
        >
          {{ saving ? 'Збереження...' : 'Зберегти запис' }}
        </button>
      </div>
    </form>
  </ModalSheet>
</template>
