import { ref } from 'vue';
import { nutritionApi } from '../services/api';
import type { DishRead, ProductRead } from '../types/nutrition';

export function useInventory() {
  const availableDishes = ref<DishRead[]>([]);
  const availableProducts = ref<ProductRead[]>([]);
  const loadingInventory = ref(false);

  async function loadInventory() {
    loadingInventory.value = true;
    try {
      const [dishes, prods] = await Promise.all([
        nutritionApi.getDishes(undefined, true),
        nutritionApi.getProducts(),
      ]);
      availableDishes.value = dishes;
      availableProducts.value = prods.filter((p) => p.availability !== 'out');
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      loadingInventory.value = false;
    }
  }

  return {
    availableDishes,
    availableProducts,
    loadingInventory,
    loadInventory,
  };
}
