<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { nutritionApi } from '../services/api';
import { useToastStore } from '../stores/toast';
import SegmentedControl from '../components/SegmentedControl.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import EmptyState from '../components/EmptyState.vue';
import DishCard from '../components/dishes/DishCard.vue';
import DishModalSheet from '../components/dishes/DishModalSheet.vue';
import type {
  DishRead,
  DishCreate,
  DishUpdate,
  DishKind,
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
const editingDish = ref<DishRead | null>(null);
const saving = ref(false);

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
async function adjustRemaining({ dish, deltaG }: { dish: DishRead; deltaG: number }) {
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
  editingDish.value = null;
  isModalOpen.value = true;
}

function openEditModal(dish: DishRead) {
  editingDish.value = dish;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingDish.value = null;
}

async function handleSaveDish(payload: DishCreate | DishUpdate) {
  saving.value = true;
  try {
    if (editingDish.value) {
      const updated = await nutritionApi.updateDish(editingDish.value.id, payload as DishUpdate);
      const index = dishes.value.findIndex((d) => d.id === editingDish.value?.id);
      if (index !== -1) {
        dishes.value[index] = updated;
      }
      toastStore.show('Страву оновлено', 'success');
    } else {
      const created = await nutritionApi.createDish(payload as DishCreate);
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

async function handleDeleteDish(id: string) {
  if (!confirm('Видалити цю страву?')) return;

  saving.value = true;
  try {
    await nutritionApi.deleteDish(id);
    dishes.value = dishes.value.filter((d) => d.id !== id);
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
      <DishCard
        v-for="dish in dishes"
        :key="dish.id"
        :dish="dish"
        :active-kind="activeKind"
        @edit="openEditModal"
        @adjust-remaining="adjustRemaining"
        @mark-finished="markFinished"
      />
    </div>

    <!-- Dish Modal Sheet -->
    <DishModalSheet
      :show="isModalOpen"
      :dish="editingDish"
      :active-kind="activeKind"
      :saving="saving"
      @close="closeModal"
      @save="handleSaveDish"
      @delete="handleDeleteDish"
    />
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
</style>
