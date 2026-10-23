<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import { formatLocalDate } from '../utils/date';
import SegmentedControl from '../components/SegmentedControl.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import ModalSheet from '../components/ModalSheet.vue';
import type {
  DishRead,
  DishCreate,
  DishUpdate,
  DishKind,
  DishComponentCreate,
} from '../types/nutrition';

const toastStore = useToastStore();

const activeKind = ref<DishKind>('ready');
const dishes = ref<DishRead[]>([]);
const loading = ref(true);

const kindOptions = [
  { label: 'Готові в холодильнику', value: 'ready' },
  { label: 'Постійні', value: 'constant' },
];

// Modal state
const isModalOpen = ref(false);
const editingDishId = ref<string | null>(null);
const saving = ref(false);

// Form fields
const formName = ref('');
const formCookedWeightG = ref<number | null>(null);
const formRemainingG = ref<number | null>(null);
const formCookedOn = ref(formatLocalDate());
const formFixedSlot = ref<string>('');
const formNotes = ref('');
const formComponents = ref<DishComponentCreate[]>([]);

const slotOptions = ['Сніданок', 'Обід', 'Полуденок', 'Вечеря', 'Перекус'];

async function loadDishes() {
  loading.value = true;
  try {
    // For ready dishes: show available (remaining_g > 0)
    // For constant dishes: kind=constant
    dishes.value = await nutritionApi.getDishes(activeKind.value, activeKind.value === 'ready' ? true : undefined);
  } catch (err) {
    console.error('Error loading dishes:', err);
    toastStore.show('Помилка завантаження страв', 'error');
  } finally {
    loading.value = false;
  }
}

watch(activeKind, () => {
  loadDishes();
});

// Quick "Закінчилась" button for ready dishes
async function markFinished(dish: DishRead) {
  const prevRemaining = dish.remaining_g;
  dish.remaining_g = 0; // optimistic

  try {
    await nutritionApi.updateDish(dish.id, { remaining_g: 0 });
    toastStore.show(`Страву «${dish.name}» списано`, 'info');
    // Remove from active list since available=true
    dishes.value = dishes.value.filter((d) => d.id !== dish.id);
  } catch (err) {
    dish.remaining_g = prevRemaining;
    toastStore.show('Не вдалося оновити залишок', 'error');
  }
}

// Quick adjust remaining weight (+/- step)
async function adjustRemaining(dish: DishRead, deltaG: number) {
  const current = dish.remaining_g ?? dish.cooked_weight_g ?? 0;
  const next = Math.max(0, current + deltaG);
  if (next === current) return;

  const prev = dish.remaining_g;
  dish.remaining_g = next;

  try {
    await nutritionApi.updateDish(dish.id, { remaining_g: next });
    if (next === 0) {
      dishes.value = dishes.value.filter((d) => d.id !== dish.id);
      toastStore.show(`Страву «${dish.name}» списано`, 'info');
    }
  } catch (err) {
    dish.remaining_g = prev;
    toastStore.show('Не вдалося оновити залишок', 'error');
  }
}

function openCreateModal() {
  editingDishId.value = null;
  formName.value = '';
  formCookedWeightG.value = null;
  formRemainingG.value = null;
  formCookedOn.value = formatLocalDate();
  formFixedSlot.value = '';
  formNotes.value = '';
  formComponents.value = activeKind.value === 'constant'
    ? [{ name: '', raw_weight_g: null, cooked_weight_g: null }]
    : [];
  isModalOpen.value = true;
}

function openEditModal(dish: DishRead) {
  editingDishId.value = dish.id;
  formName.value = dish.name;
  formCookedWeightG.value = dish.cooked_weight_g;
  formRemainingG.value = dish.remaining_g;
  formCookedOn.value = dish.cooked_on || formatLocalDate();
  formFixedSlot.value = dish.fixed_slot || '';
  formNotes.value = dish.notes || '';
  formComponents.value = (dish.components || []).map((c) => ({
    name: c.name,
    raw_weight_g: c.raw_weight_g,
    cooked_weight_g: c.cooked_weight_g,
  }));
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingDishId.value = null;
}

function addComponentRow() {
  formComponents.value.push({
    name: '',
    raw_weight_g: null,
    cooked_weight_g: null,
  });
}

function removeComponentRow(index: number) {
  formComponents.value.splice(index, 1);
}

async function handleSaveDish() {
  if (!formName.value.trim()) {
    toastStore.show('Вкажіть назву страви', 'warning');
    return;
  }

  if (activeKind.value === 'ready') {
    if (!formCookedWeightG.value) {
      formCookedWeightG.value = 500;
    } else if (formCookedWeightG.value <= 0) {
      toastStore.show('Готова вага має бути > 0 г', 'warning');
      return;
    }
  } else if (activeKind.value === 'constant') {
    const validComps = formComponents.value.filter((c) => c.name.trim().length > 0);
    if (validComps.length === 0) {
      toastStore.show('Для постійної страви потрібен щонайменше 1 складник', 'warning');
      return;
    }
  }

  saving.value = true;
  try {
    const cleanedComponents = formComponents.value
      .filter((c) => c.name.trim().length > 0)
      .map((c) => ({
        name: c.name.trim(),
        raw_weight_g: c.raw_weight_g ? Number(c.raw_weight_g) : null,
        cooked_weight_g: c.cooked_weight_g ? Number(c.cooked_weight_g) : null,
      }));

    if (editingDishId.value) {
      const payload: DishUpdate = {
        name: formName.value.trim(),
        cooked_weight_g: formCookedWeightG.value ? Number(formCookedWeightG.value) : null,
        remaining_g: formRemainingG.value !== null && formRemainingG.value !== undefined
          ? Number(formRemainingG.value)
          : null,
        cooked_on: activeKind.value === 'ready' ? formCookedOn.value : null,
        fixed_slot: activeKind.value === 'constant' ? (formFixedSlot.value.trim() || null) : null,
        notes: formNotes.value.trim() || null,
        components: cleanedComponents,
      };

      const updated = await nutritionApi.updateDish(editingDishId.value, payload);
      const index = dishes.value.findIndex((d) => d.id === editingDishId.value);
      if (index !== -1) {
        dishes.value[index] = updated;
      }
      toastStore.show('Страву оновлено', 'success');
    } else {
      const payload: DishCreate = {
        name: formName.value.trim(),
        kind: activeKind.value,
        cooked_weight_g: formCookedWeightG.value ? Number(formCookedWeightG.value) : null,
        remaining_g: formRemainingG.value !== null && formRemainingG.value !== undefined
          ? Number(formRemainingG.value)
          : (formCookedWeightG.value ? Number(formCookedWeightG.value) : null),
        cooked_on: activeKind.value === 'ready' ? formCookedOn.value : null,
        fixed_slot: activeKind.value === 'constant' ? (formFixedSlot.value.trim() || null) : null,
        notes: formNotes.value.trim() || null,
        components: cleanedComponents,
      };

      const created = await nutritionApi.createDish(payload);
      dishes.value.unshift(created);
      toastStore.show('Страву створено', 'success');
    }

    closeModal();
  } catch (err: unknown) {
    console.error('Save dish error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка збереження', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleDeleteDish() {
  if (!editingDishId.value) return;
  if (!confirm('Видалити цю страву?')) return;

  saving.value = true;
  try {
    await nutritionApi.deleteDish(editingDishId.value);
    dishes.value = dishes.value.filter((d) => d.id !== editingDishId.value);
    toastStore.show('Страву видалено', 'success');
    closeModal();
  } catch (err: unknown) {
    console.error('Delete dish error:', err);
    toastStore.show(err instanceof Error ? err.message : 'Помилка видалення', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadDishes();
});
</script>

<template>
  <div class="dishes-view">
    <div class="view-header">
      <div>
        <h1 class="view-title">Страви</h1>
        <p class="view-subtitle">Холодильник та постійні рецепти</p>
      </div>
      <button class="btn btn-primary add-dish-btn" @click="openCreateModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>Додати</span>
      </button>
    </div>

    <!-- Segmented Control Kind Switcher -->
    <div class="kind-switcher">
      <SegmentedControl v-model="activeKind" :options="kindOptions" />
    </div>

    <LoadingSpinner v-if="loading" text="Завантаження страв..." />

    <div v-else-if="dishes.length === 0">
      <EmptyState
        :title="activeKind === 'ready' ? 'Холодильник порожній' : 'Немає постійних страв'"
        :description="activeKind === 'ready'
          ? 'Додайте приготовлені страви з вагою, щоб ШІ міг розподілити їх у меню дня'
          : 'Постійні страви готуються щоразу свіжими (наприклад, ранкова каша чи сир)'"
        action-label="Додати страву"
        @action="openCreateModal"
      />
    </div>

    <!-- Dishes List -->
    <div v-else class="dishes-list">
      <div
        v-for="dish in dishes"
        :key="dish.id"
        class="card dish-card"
      >
        <!-- Header row -->
        <div class="dish-header-row">
          <div class="dish-title-area" @click="openEditModal(dish)">
            <h3 class="dish-name">{{ dish.name }}</h3>
            <div class="dish-meta">
              <span v-if="dish.fixed_slot" class="badge badge-info">
                {{ dish.fixed_slot }}
              </span>
              <span v-if="dish.cooked_on && activeKind === 'ready'" class="cooked-date num-mono">
                Приготовлено: {{ dish.cooked_on }}
              </span>
            </div>
          </div>

          <button
            class="btn-icon edit-action-btn"
            @click="openEditModal(dish)"
            aria-label="Редагувати страву"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>

        <!-- Components section if present -->
        <div v-if="dish.components && dish.components.length > 0" class="dish-components">
          <div class="components-label">Складники:</div>
          <div class="components-chips">
            <span
              v-for="c in dish.components"
              :key="c.id"
              class="component-chip"
            >
              {{ c.name }}
              <span v-if="c.raw_weight_g || c.cooked_weight_g" class="num-mono comp-weight">
                ({{ c.cooked_weight_g ?? c.raw_weight_g }} г)
              </span>
            </span>
          </div>
        </div>

        <!-- Notes if present -->
        <div v-if="dish.notes" class="dish-notes">
          {{ dish.notes }}
        </div>

        <!-- Ready dish weight & stepper controls -->
        <div v-if="activeKind === 'ready'" class="ready-dish-actions">
          <div class="weight-display">
            <span class="weight-label">Залишок:</span>
            <span class="weight-value num-mono">
              <template v-if="dish.cooked_weight_g !== null || dish.remaining_g !== null">
                <strong>{{ dish.remaining_g ?? dish.cooked_weight_g }}</strong> / {{ dish.cooked_weight_g ?? '—' }} г
              </template>
              <template v-else>
                Без ваги
              </template>
            </span>
          </div>

          <div class="stepper-controls">
            <button
              class="btn-step"
              @click="adjustRemaining(dish, -50)"
              title="Відняти 50 г"
              aria-label="Відняти 50 грамів"
            >
              −50г
            </button>
            <button
              class="btn-step"
              @click="adjustRemaining(dish, 50)"
              title="Додати 50 г"
              aria-label="Додати 50 грамів"
            >
              +50г
            </button>
            <button
              class="btn btn-danger btn-finish"
              @click="markFinished(dish)"
            >
              Закінчилась
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dish Modal Sheet -->
    <ModalSheet
      :show="isModalOpen"
      :title="editingDishId ? 'Редагувати страву' : (activeKind === 'ready' ? 'Нова готова страва' : 'Нова постійна страва')"
      @close="closeModal"
    >
      <form @submit.prevent="handleSaveDish" class="dish-form">
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
        <div class="components-editor">
          <div class="section-header">
            <span>Складники (для точного розрахунку ШІ)</span>
            <button type="button" class="btn-text-action" @click="addComponentRow">
              + Додати
            </button>
          </div>

          <div v-if="formComponents.length === 0" class="no-comps-hint">
            Складників немає (ШІ оцінюватиме калорійність за назвою)
          </div>

          <div
            v-for="(comp, idx) in formComponents"
            :key="idx"
            class="comp-edit-row"
          >
            <input
              v-model="comp.name"
              type="text"
              class="form-input comp-name-input"
              placeholder="Складник (вівсянка, сир...)"
              required
            />
            <input
              v-model.number="comp.raw_weight_g"
              type="number"
              class="form-input comp-w-input num-mono"
              placeholder="Сира г"
              min="0"
            />
            <input
              v-model.number="comp.cooked_weight_g"
              type="number"
              class="form-input comp-w-input num-mono"
              placeholder="Готова г"
              min="0"
            />
            <button
              type="button"
              class="btn-icon del-comp-btn"
              @click="removeComponentRow(idx)"
              aria-label="Видалити складник"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

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
            {{ saving ? 'Збереження...' : (editingDishId ? 'Оновити страву' : 'Додати страву') }}
          </button>

          <button
            v-if="editingDishId"
            type="button"
            class="btn btn-danger btn-full"
            :disabled="saving"
            @click="handleDeleteDish"
          >
            Видалити страву
          </button>
        </div>
      </form>
    </ModalSheet>
  </div>
</template>

<style scoped>
.dishes-view {
  padding-bottom: var(--space-20);
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-16);
}

.view-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.view-subtitle {
  font-size: 12.5px;
  color: var(--text-muted);
}

.add-dish-btn {
  min-height: 40px;
  padding: 0 var(--space-12);
  font-size: 13.5px;
}

.kind-switcher {
  margin-bottom: var(--space-16);
}

.dishes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.dish-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-bottom: 0;
}

.dish-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.dish-title-area {
  flex: 1;
  cursor: pointer;
}

.dish-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.dish-meta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.cooked-date {
  font-size: 12px;
  color: var(--text-muted);
}

.edit-action-btn {
  color: var(--text-muted);
}

.dish-components {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--radius-control);
  padding: var(--space-8) var(--space-12);
}

.components-label {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.components-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.component-chip {
  font-size: 12.5px;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  color: var(--text-primary);
}

.comp-weight {
  color: var(--text-muted);
  font-size: 11.5px;
}

.dish-notes {
  font-size: 12.5px;
  color: var(--text-muted);
  font-style: italic;
}

.ready-dish-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-8);
  border-top: 1px solid var(--surface-border);
  gap: var(--space-8);
  flex-wrap: wrap;
}

.weight-display {
  display: flex;
  flex-direction: column;
}

.weight-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.weight-value {
  font-size: 14px;
  color: var(--text-primary);
}

.weight-value strong {
  color: var(--info);
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-step {
  min-height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-control);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--surface-border);
  color: var(--text-primary);
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: 600;
  cursor: pointer;
}

.btn-step:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-finish {
  min-height: 36px;
  padding: 0 12px;
  font-size: 12px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

.components-editor {
  margin-bottom: var(--space-16);
}

.btn-text-action {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.no-comps-hint {
  font-size: 12px;
  color: var(--text-muted);
  padding: var(--space-8) 0;
}

.comp-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.comp-name-input {
  flex: 2;
  min-height: 38px;
}

.comp-w-input {
  flex: 1;
  min-height: 38px;
  padding: 4px 6px;
  font-size: 12px;
}

.del-comp-btn {
  min-width: 38px;
  min-height: 38px;
  color: var(--text-dim);
}

.del-comp-btn:hover {
  color: var(--danger);
}

.modal-actions-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  margin-top: var(--space-20);
}

.btn-full {
  width: 100%;
}
</style>
