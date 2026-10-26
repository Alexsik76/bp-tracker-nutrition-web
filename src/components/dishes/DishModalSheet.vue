<script setup lang="ts">
import { ref, watch } from 'vue';
import ModalSheet from '../ModalSheet.vue';
import DishComponentsEditor from './DishComponentsEditor.vue';
import { useToastStore } from '../../stores/toast';
import { formatLocalDate } from '../../utils/date';
import type {
  DishRead,
  DishCreate,
  DishUpdate,
  DishKind,
  DishComponentCreate,
} from '../../types/nutrition';

const props = defineProps<{
  show: boolean;
  dish: DishRead | null;
  activeKind: DishKind;
  saving: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: DishCreate | DishUpdate): void;
  (e: 'delete', id: string): void;
}>();

const toastStore = useToastStore();

const slotOptions = ['Сніданок', 'Обід', 'Полуденок', 'Вечеря', 'Перекус'];

const formName = ref('');
const formCookedWeightG = ref<number | null>(null);
const formRemainingG = ref<number | null>(null);
const formCookedOn = ref(formatLocalDate());
const formFixedSlot = ref<string>('');
const formNotes = ref('');
const formComponents = ref<DishComponentCreate[]>([]);

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      if (props.dish) {
        formName.value = props.dish.name;
        formCookedWeightG.value = props.dish.cooked_weight_g;
        formRemainingG.value = props.dish.remaining_g;
        formCookedOn.value = props.dish.cooked_on || formatLocalDate();
        formFixedSlot.value = props.dish.fixed_slot || '';
        formNotes.value = props.dish.notes || '';
        formComponents.value = (props.dish.components || []).map((c) => ({
          name: c.name,
          raw_weight_g: c.raw_weight_g,
          cooked_weight_g: c.cooked_weight_g,
        }));
      } else {
        formName.value = '';
        formCookedWeightG.value = null;
        formRemainingG.value = null;
        formCookedOn.value = formatLocalDate();
        formFixedSlot.value = '';
        formNotes.value = '';
        formComponents.value = props.activeKind === 'constant'
          ? [{ name: '', raw_weight_g: null, cooked_weight_g: null }]
          : [];
      }
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!formName.value.trim()) {
    toastStore.show('Вкажіть назву страви', 'warning');
    return;
  }

  if (props.activeKind === 'ready') {
    if (!formCookedWeightG.value) {
      formCookedWeightG.value = 500;
    } else if (formCookedWeightG.value <= 0) {
      toastStore.show('Готова вага має бути > 0 г', 'warning');
      return;
    }
  } else if (props.activeKind === 'constant') {
    const validComps = formComponents.value.filter((c) => c.name.trim().length > 0);
    if (validComps.length === 0) {
      toastStore.show('Для постійної страви потрібен щонайменше 1 складник', 'warning');
      return;
    }
  }

  const cleanedComponents = formComponents.value
    .filter((c) => c.name.trim().length > 0)
    .map((c) => ({
      name: c.name.trim(),
      raw_weight_g: c.raw_weight_g ? Number(c.raw_weight_g) : null,
      cooked_weight_g: c.cooked_weight_g ? Number(c.cooked_weight_g) : null,
    }));

  if (props.dish) {
    const payload: DishUpdate = {
      name: formName.value.trim(),
      cooked_weight_g: formCookedWeightG.value ? Number(formCookedWeightG.value) : null,
      remaining_g: formRemainingG.value !== null && formRemainingG.value !== undefined
        ? Number(formRemainingG.value)
        : null,
      cooked_on: props.activeKind === 'ready' ? formCookedOn.value : null,
      fixed_slot: props.activeKind === 'constant' ? (formFixedSlot.value.trim() || null) : null,
      notes: formNotes.value.trim() || null,
      components: cleanedComponents,
    };
    emit('save', payload);
  } else {
    const payload: DishCreate = {
      name: formName.value.trim(),
      kind: props.activeKind,
      cooked_weight_g: formCookedWeightG.value ? Number(formCookedWeightG.value) : null,
      remaining_g: formRemainingG.value !== null && formRemainingG.value !== undefined
        ? Number(formRemainingG.value)
        : (formCookedWeightG.value ? Number(formCookedWeightG.value) : null),
      cooked_on: props.activeKind === 'ready' ? formCookedOn.value : null,
      fixed_slot: props.activeKind === 'constant' ? (formFixedSlot.value.trim() || null) : null,
      notes: formNotes.value.trim() || null,
      components: cleanedComponents,
    };
    emit('save', payload);
  }
}
</script>

<template>
  <ModalSheet
    :show="show"
    :title="dish ? 'Редагувати страву' : (activeKind === 'ready' ? 'Нова готова страва' : 'Нова постійна страва')"
    @close="emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="dish-form">
      <div class="form-group">
        <label class="form-label" for="dishName">Назва страви</label>
        <input
          id="dishName"
          v-model="formName"
          type="text"
          class="form-input"
          placeholder="Суп гречаний, Запечена риба..."
          required
          autofocus
        />
      </div>

      <!-- Ready fields -->
      <template v-if="activeKind === 'ready'">
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label" for="dishCookedWeight">Готова вага (г, за замовч. 500 г)</label>
            <input
              id="dishCookedWeight"
              v-model.number="formCookedWeightG"
              type="number"
              class="form-input num-mono"
              placeholder="500"
              min="1"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="dishRemaining">Залишок (г)</label>
            <input
              id="dishRemaining"
              v-model.number="formRemainingG"
              type="number"
              class="form-input num-mono"
              placeholder="За замовч. = готовій"
              min="0"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="dishCookedOn">Дата приготування</label>
          <input
            id="dishCookedOn"
            v-model="formCookedOn"
            type="date"
            class="form-input num-mono"
            required
          />
        </div>
      </template>

      <!-- Constant fields -->
      <template v-else>
        <div class="form-group">
          <label class="form-label" for="dishFixedSlot">Закріплений прийом (опційно)</label>
          <select id="dishFixedSlot" v-model="formFixedSlot" class="form-select">
            <option value="">Не закріплено</option>
            <option v-for="s in slotOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </template>

      <!-- Dynamic Components Section -->
      <DishComponentsEditor v-model="formComponents" />

      <div class="form-group">
        <label class="form-label" for="dishNotes">Нотатки</label>
        <textarea
          id="dishNotes"
          v-model="formNotes"
          class="form-textarea"
          placeholder="Особливості рецепту, дата заморозки..."
        ></textarea>
      </div>

      <div class="modal-actions-area">
        <button
          type="submit"
          class="btn btn-primary btn-full"
          :disabled="saving"
        >
          {{ saving ? 'Збереження...' : (dish ? 'Оновити страву' : 'Додати страву') }}
        </button>

        <button
          v-if="dish"
          type="button"
          class="btn btn-danger btn-full"
          :disabled="saving"
          @click="emit('delete', dish.id)"
        >
          Видалити страву
        </button>
      </div>
    </form>
  </ModalSheet>
</template>
