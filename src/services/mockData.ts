import { ApiError } from './api';
import type {
  NutritionProfileRead,
  NutritionProfileUpsert,
  ProductRead,
  ProductCreate,
  ProductUpdate,
  DishRead,
  DishCreate,
  DishUpdate,
  DishKind,
  MenuRead,
  MenuUpdate,
  MealCreate,
  MenuItemRead,
  MenuItemCreate,
  MenuItemUpdate,
  GenerationRequest,
  GenerationResultRead,
  OffPlanEntryRead,
  OffPlanEntryCreate,
  MenuNoteRead,
  MenuNoteCreate,
  DayMenuRead,
  PinnedMealRead,
  PinnedMealUpsert,
  PinnedMealItemRead,
  AvailablePin,
  MealType,
} from '../types/nutrition';
import { mealTypeLabel, mealTypeOrder } from '../utils/mealTypes';

let mockProfile: NutritionProfileRead = {
  user_id: 'dev-bypass-user',
  sex: 'male',
  birth_year: 1976,
  height_cm: 200,
  weight_kg: 118,
  target_weight_kg: 110,
  pace_kg_per_week: 0.75,
  restrictions: 'Видалений жовчний міхур у лютому 2026. Помірна кількість жирів за прийом.',
  dislikes: 'Селера, кінза, надлишок молочних продуктів',
  meals: [
    { type: 'breakfast', time: '08:30' },
    { type: 'lunch', time: '13:30' },
    { type: 'dinner', time: '19:00' },
  ],
  updated_at: new Date().toISOString(),
};

let mockProducts: ProductRead[] = [
  {
    id: 'prod-1',
    user_id: 'dev-bypass-user',
    name: 'Яйця курячі',
    availability: 'in_stock',
    preference: 'neutral',
    eat_raw: false,
    count: 10,
    stock_g: 500,
    reserved_g: 0,
    available_g: 500,
    kcal: 143,
    protein_g: 12.6,
    fat_g: 9.5,
    carbs_g: 0.7,
    fiber_g: 0,
    sugar_g: 0.4,
    sodium_mg: 142,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    user_id: 'dev-bypass-user',
    name: 'Вівсяні пластівці',
    availability: 'in_stock',
    preference: 'preferred',
    eat_raw: false,
    count: null,
    stock_g: 800,
    reserved_g: 45,
    available_g: 755,
    kcal: 389,
    protein_g: 16.9,
    fat_g: 6.9,
    carbs_g: 66.3,
    fiber_g: 10.6,
    sugar_g: 0,
    sodium_mg: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    user_id: 'dev-bypass-user',
    name: 'Помідори чері',
    availability: 'low',
    preference: 'preferred',
    eat_raw: true,
    count: null,
    stock_g: 300,
    reserved_g: 0,
    available_g: 300,
    kcal: null,
    protein_g: null,
    fat_g: null,
    carbs_g: null,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    user_id: 'dev-bypass-user',
    name: 'Казеїн шоколадний',
    availability: 'in_stock',
    preference: 'avoid',
    eat_raw: true,
    count: null,
    stock_g: 400,
    reserved_g: 0,
    available_g: 400,
    kcal: 360,
    protein_g: 78.0,
    fat_g: 1.5,
    carbs_g: 4.0,
    fiber_g: 0,
    sugar_g: 1.0,
    sodium_mg: 180,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    user_id: 'dev-bypass-user',
    name: 'Яблука Голден',
    availability: 'in_stock',
    preference: 'preferred',
    eat_raw: true,
    count: 4,
    stock_g: 600,
    reserved_g: 0,
    available_g: 600,
    kcal: 52,
    protein_g: 0.3,
    fat_g: 0.2,
    carbs_g: 13.8,
    fiber_g: 2.4,
    sugar_g: 10.4,
    sodium_mg: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    user_id: 'dev-bypass-user',
    name: 'Форель',
    availability: 'in_stock',
    preference: 'preferred',
    eat_raw: false,
    count: null,
    stock_g: 1000,
    reserved_g: 700,
    available_g: 300,
    kcal: 148,
    protein_g: 20.8,
    fat_g: 6.6,
    carbs_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 52,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    user_id: 'dev-bypass-user',
    name: 'Кисломолочний сир 5%',
    availability: 'in_stock',
    preference: 'preferred',
    eat_raw: true,
    count: null,
    stock_g: 400,
    reserved_g: 150,
    available_g: 250,
    kcal: 121,
    protein_g: 17.0,
    fat_g: 5.0,
    carbs_g: 3.0,
    fiber_g: 0,
    sugar_g: 2.5,
    sodium_mg: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockDishes: DishRead[] = [
  {
    id: 'dish-1',
    user_id: 'dev-bypass-user',
    name: 'Запечена форель з лимоном',
    kind: 'ready',
    cooked_weight_g: 600,
    remaining_g: 350,
    cooked_on: new Date().toISOString().slice(0, 10),
    fixed_meal_type: null,
    notes: 'Свіжа риба на 2 дні',
    kcal: 148,
    protein_g: 20.8,
    fat_g: 6.6,
    carbs_g: 0,
    fiber_g: 0,
    sugar_g: 0,
    sodium_mg: 52,
    components: [
      { id: 'comp-1', dish_id: 'dish-1', product_id: 'prod-6', weight_g: 700 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dish-2',
    user_id: 'dev-bypass-user',
    name: 'Ранкова вівсянка з сиром',
    kind: 'constant',
    cooked_weight_g: null,
    remaining_g: null,
    cooked_on: null,
    fixed_meal_type: 'breakfast',
    notes: 'Постійна ранкова страва',
    kcal: 185,
    protein_g: 17.0,
    fat_g: 5.5,
    carbs_g: 18.0,
    fiber_g: 2.5,
    sugar_g: 2.0,
    sodium_mg: 50,
    components: [
      { id: 'comp-2', dish_id: 'dish-2', product_id: 'prod-2', weight_g: 45 },
      { id: 'comp-3', dish_id: 'dish-2', product_id: 'prod-7', weight_g: 150 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockPinnedMeals: PinnedMealRead[] = [
  {
    id: 'pin-1',
    meal_type: 'breakfast',
    active: true,
    items: [
      {
        id: 'pin-item-1',
        pinned_meal_id: 'pin-1',
        dish_id: 'dish-2',
        title: 'Ранкова вівсянка з сиром',
        portion_g: 250,
        portion_text: null,
        kcal: 420,
        protein_g: 25,
        fat_g: 10,
        carbs_g: 45,
        fiber_g: 4,
        sugar_g: 3,
        sodium_mg: 120,
        position: 0,
      },
      {
        id: 'pin-item-2',
        pinned_meal_id: 'pin-1',
        dish_id: null,
        title: 'Яблука Голден',
        portion_g: 150,
        portion_text: '1 шт',
        kcal: 75,
        protein_g: 0.5,
        fat_g: 0.3,
        carbs_g: 20,
        fiber_g: 3,
        sugar_g: 15,
        sodium_mg: 2,
        position: 1,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockDeletedSlots = new Set<string>();
let mockUnpinnedDaySlots = new Set<string>();

let mockMenus: MenuRead[] = [
  {
    id: 'menu-1',
    user_id: 'dev-bypass-user',
    date: new Date().toISOString().slice(0, 10),
    meal_type: 'breakfast',
    time: '08:30',
    status: 'eaten',
    eaten_at: new Date().toISOString(),
    regenerations: 0,
    kcal_incomplete: false,
    pinned: true,
    items: [
      {
        id: 'item-1',
        menu_id: 'menu-1',
        dish_id: 'dish-2',
        title: 'Ранкова вівсянка з сиром',
        portion_g: 250,
        portion_text: null,
        kcal: 420,
        protein_g: 25,
        fat_g: 10,
        carbs_g: 45,
        fiber_g: 4,
        sugar_g: 3,
        sodium_mg: 120,
        nutrition_source: 'model',
        origin: 'generated',
        position: 0,
        incomplete: false,
        updated_at: new Date().toISOString(),
      },
      {
        id: 'item-1b',
        menu_id: 'menu-1',
        dish_id: null,
        title: 'Яблука Голден',
        portion_g: null,
        portion_text: '1 шт',
        kcal: 75,
        protein_g: 0.5,
        fat_g: 0.3,
        carbs_g: 20,
        fiber_g: 3,
        sugar_g: 15,
        sodium_mg: 2,
        nutrition_source: 'model',
        origin: 'generated',
        position: 1,
        incomplete: false,
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'menu-2',
    user_id: 'dev-bypass-user',
    date: new Date().toISOString().slice(0, 10),
    meal_type: 'lunch',
    time: '13:30',
    status: 'planned',
    eaten_at: null,
    regenerations: 0,
    kcal_incomplete: false,
    pinned: false,
    items: [
      {
        id: 'item-2',
        menu_id: 'menu-2',
        dish_id: 'dish-1',
        title: 'Запечена форель з лимоном',
        portion_g: 250,
        portion_text: null,
        kcal: 380,
        protein_g: 35,
        fat_g: 18,
        carbs_g: 12,
        fiber_g: 2,
        sugar_g: 1,
        sodium_mg: 320,
        nutrition_source: 'model',
        origin: 'generated',
        position: 0,
        incomplete: false,
        updated_at: new Date().toISOString(),
      },
      {
        id: 'item-3',
        menu_id: 'menu-2',
        dish_id: null,
        title: 'Помідори чері',
        portion_g: 150,
        portion_text: null,
        kcal: 35,
        protein_g: 1.5,
        fat_g: 0.3,
        carbs_g: 6,
        fiber_g: 1.8,
        sugar_g: 4,
        sodium_mg: 10,
        nutrition_source: 'user',
        origin: 'manual',
        position: 1,
        incomplete: false,
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'menu-3',
    user_id: 'dev-bypass-user',
    date: new Date().toISOString().slice(0, 10),
    meal_type: 'dinner',
    time: '19:00',
    status: 'planned',
    eaten_at: null,
    regenerations: 0,
    kcal_incomplete: false,
    pinned: false,
    items: [
      {
        id: 'item-4',
        menu_id: 'menu-3',
        dish_id: null,
        title: 'Омлет з 2 яєць',
        portion_g: null,
        portion_text: '2 шт',
        kcal: 190,
        protein_g: 14,
        fat_g: 12,
        carbs_g: 1.5,
        fiber_g: 0,
        sugar_g: 0.8,
        sodium_mg: 180,
        nutrition_source: 'model',
        origin: 'generated',
        position: 0,
        incomplete: false,
        updated_at: new Date().toISOString(),
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockOffPlan: OffPlanEntryRead[] = [];
let mockNotes: MenuNoteRead[] = [];

function deriveMenuState(menu: MenuRead): void {
  const items = menu.items || [];
  menu.kcal_incomplete = items.some(
    (i) => i.kcal === null || i.kcal === undefined
  );

  if (menu.eaten_at) {
    menu.status = 'eaten';
  } else if (items.some((i) => i.incomplete)) {
    menu.status = 'incomplete';
  } else {
    menu.status = 'planned';
  }
}

function computeCanGenerateDay(menus: MenuRead[]): boolean {
  if (menus.length === 0) return true;
  return menus.some((m) => {
    if (m.status === 'eaten') return false;
    if (m.pinned) return false;
    return true;
  });
}

function computeDayGenerationReplacesManual(menus: MenuRead[]): boolean {
  return menus.some((m) =>
    m.status !== 'eaten' &&
    m.items.some((i) => i.origin === 'manual')
  );
}

export const mockNutritionApi = {
  getProfile: async (): Promise<NutritionProfileRead> => {
    return JSON.parse(JSON.stringify(mockProfile));
  },

  upsertProfile: async (data: NutritionProfileUpsert): Promise<NutritionProfileRead> => {
    mockProfile = {
      ...mockProfile,
      ...data,
      updated_at: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(mockProfile));
  },

  getProducts: async (): Promise<ProductRead[]> => {
    return JSON.parse(JSON.stringify(mockProducts));
  },

  createProduct: async (data: ProductCreate): Promise<ProductRead> => {
    const item: ProductRead = {
      id: `prod-${Date.now()}`,
      user_id: 'dev-bypass-user',
      name: data.name,
      availability: data.availability || 'in_stock',
      preference: data.preference || 'neutral',
      eat_raw: Boolean(data.eat_raw),
      count: data.count || null,
      stock_g: data.stock_g ?? null,
      reserved_g: 0,
      available_g: data.stock_g ?? null,
      kcal: data.kcal ?? null,
      protein_g: data.protein_g ?? null,
      fat_g: data.fat_g ?? null,
      carbs_g: data.carbs_g ?? null,
      fiber_g: data.fiber_g ?? null,
      sugar_g: data.sugar_g ?? null,
      sodium_mg: data.sodium_mg ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockProducts.unshift(item);
    return JSON.parse(JSON.stringify(item));
  },

  updateProduct: async (productId: string, data: ProductUpdate): Promise<ProductRead> => {
    const item = mockProducts.find((p) => p.id === productId);
    if (item) {
      Object.assign(item, data, { updated_at: new Date().toISOString() });
      if (data.stock_g !== undefined) {
        const reserved = item.reserved_g || 0;
        item.available_g = item.stock_g !== null ? item.stock_g - reserved : null;
      }
      return JSON.parse(JSON.stringify(item));
    }
    throw new Error('Product not found');
  },

  estimateProduct: async (productId: string): Promise<ProductRead> => {
    const item = mockProducts.find((p) => p.id === productId);
    if (!item) {
      throw new ApiError('Product not found', 404);
    }
    item.kcal = 125;
    item.protein_g = 6.0;
    item.fat_g = 3.5;
    item.carbs_g = 15.0;
    item.fiber_g = 2.0;
    item.sugar_g = 1.0;
    item.sodium_mg = 30;
    item.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(item));
  },

  deleteProduct: async (productId: string): Promise<void> => {
    mockProducts = mockProducts.filter((p) => p.id !== productId);
  },

  getDishes: async (kind?: DishKind, available?: boolean): Promise<DishRead[]> => {
    let result = mockDishes;
    if (kind) {
      result = result.filter((d) => d.kind === kind);
    }
    if (available) {
      result = result.filter((d) => d.kind === 'constant' || (d.remaining_g !== null && d.remaining_g > 0));
    }
    return JSON.parse(JSON.stringify(result));
  },

  getDish: async (dishId: string): Promise<DishRead> => {
    const dish = mockDishes.find((d) => d.id === dishId);
    if (dish) return JSON.parse(JSON.stringify(dish));
    throw new Error('Dish not found');
  },

  createDish: async (data: DishCreate): Promise<DishRead> => {
    const compReads: { id: string; dish_id: string; product_id: string; weight_g: number }[] = [];
    const dishId = `dish-${Date.now()}`;

    for (const [idx, c] of (data.components || []).entries()) {
      let pId = c.product_id;
      if (c.new_product && c.new_product.name) {
        const newProd: ProductRead = {
          id: `prod-${Date.now()}-${idx}`,
          user_id: 'dev-bypass-user',
          name: c.new_product.name,
          availability: 'in_stock',
          preference: 'neutral',
          eat_raw: false,
          count: null,
          stock_g: c.new_product.stock_g ?? null,
          reserved_g: 0,
          available_g: c.new_product.stock_g ?? null,
          kcal: 100,
          protein_g: 5,
          fat_g: 2,
          carbs_g: 15,
          fiber_g: 1,
          sugar_g: 1,
          sodium_mg: 20,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockProducts.unshift(newProd);
        pId = newProd.id;
      }

      if (pId) {
        const prod = mockProducts.find((p) => p.id === pId);
        if (prod && prod.stock_g !== null && prod.stock_g !== undefined) {
          const avail = prod.available_g ?? prod.stock_g;
          if (c.weight_g > avail) {
            throw new ApiError(`Not enough available stock for product '${prod.name}'`, 409, {
              detail: `Not enough available stock for product '${prod.name}'`,
            });
          }
          prod.stock_g -= c.weight_g;
          prod.available_g = Math.max(0, (prod.available_g ?? prod.stock_g) - c.weight_g);
        }
        compReads.push({
          id: `comp-${Date.now()}-${idx}`,
          dish_id: dishId,
          product_id: pId,
          weight_g: c.weight_g,
        });
      }
    }

    const dish: DishRead = {
      id: dishId,
      user_id: 'dev-bypass-user',
      name: data.name,
      kind: data.kind,
      cooked_weight_g: data.cooked_weight_g || null,
      remaining_g: data.remaining_g !== undefined ? data.remaining_g : (data.cooked_weight_g || null),
      cooked_on: data.cooked_on || null,
      fixed_meal_type: data.fixed_meal_type || null,
      notes: data.notes || null,
      kcal: 220,
      protein_g: 18,
      fat_g: 8,
      carbs_g: 16,
      fiber_g: 2,
      sugar_g: 1,
      sodium_mg: 150,
      components: compReads,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDishes.unshift(dish);
    return JSON.parse(JSON.stringify(dish));
  },

  updateDish: async (dishId: string, data: DishUpdate): Promise<DishRead> => {
    const dish = mockDishes.find((d) => d.id === dishId);
    if (dish) {
      if (data.components) {
        const compReads: { id: string; dish_id: string; product_id: string; weight_g: number }[] = [];
        for (const [idx, c] of data.components.entries()) {
          let pId = c.product_id;
          if (c.new_product && c.new_product.name) {
            const newProd: ProductRead = {
              id: `prod-${Date.now()}-${idx}`,
              user_id: 'dev-bypass-user',
              name: c.new_product.name,
              availability: 'in_stock',
              preference: 'neutral',
              eat_raw: false,
              count: null,
              stock_g: c.new_product.stock_g ?? null,
              reserved_g: 0,
              available_g: c.new_product.stock_g ?? null,
              kcal: 100,
              protein_g: 5,
              fat_g: 2,
              carbs_g: 15,
              fiber_g: 1,
              sugar_g: 1,
              sodium_mg: 20,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            mockProducts.unshift(newProd);
            pId = newProd.id;
          }
          if (pId) {
            const prod = mockProducts.find((p) => p.id === pId);
            if (prod && prod.stock_g !== null && prod.stock_g !== undefined) {
              const avail = prod.available_g ?? prod.stock_g;
              if (c.weight_g > avail) {
                throw new ApiError(`Not enough available stock for product '${prod.name}'`, 409, {
                  detail: `Not enough available stock for product '${prod.name}'`,
                });
              }
            }
            compReads.push({
              id: `comp-${Date.now()}-${idx}`,
              dish_id: dishId,
              product_id: pId,
              weight_g: c.weight_g,
            });
          }
        }
        dish.components = compReads;
      }
      Object.assign(dish, {
        name: data.name ?? dish.name,
        cooked_weight_g: data.cooked_weight_g ?? dish.cooked_weight_g,
        remaining_g: data.remaining_g ?? dish.remaining_g,
        cooked_on: data.cooked_on ?? dish.cooked_on,
        fixed_meal_type: data.fixed_meal_type ?? dish.fixed_meal_type,
        notes: data.notes ?? dish.notes,
        updated_at: new Date().toISOString(),
      });
      return JSON.parse(JSON.stringify(dish));
    }
    throw new Error('Dish not found');
  },

  deleteDish: async (dishId: string): Promise<void> => {
    mockDishes = mockDishes.filter((d) => d.id !== dishId);
  },

  getDayMenus: async (menuDate: string): Promise<DayMenuRead> => {
    // 1. Gather persisted menus for this date (excluding deleted ones)
    const persisted = mockMenus
      .filter((m) => (m.date === menuDate || !m.date) && !mockDeletedSlots.has(`${menuDate}:${m.meal_type}`))
      .map((m) => ({ ...m, date: menuDate }));

    for (const m of persisted) {
      deriveMenuState(m);
    }

    // 2. Project profile schedule meals not yet persisted and not deleted
    const persistedSlots = new Set(persisted.map((m) => m.meal_type));
    const projected: MenuRead[] = [];

    for (const pm of mockProfile.meals) {
      const isDeleted = mockDeletedSlots.has(`${menuDate}:${pm.type}`);
      const isPersisted = persistedSlots.has(pm.type);
      const isUnpinned = mockUnpinnedDaySlots.has(`${menuDate}:${pm.type}`);
      if (!isDeleted && !isPersisted) {
        const activePin = !isUnpinned && mockPinnedMeals.find((p) => p.active && p.meal_type === pm.type);
        const items: MenuItemRead[] = activePin ? activePin.items.map((pi) => ({
          id: `item-proj-${pi.id}`,
          menu_id: `menu-proj-${pm.type}`,
          dish_id: pi.dish_id,
          title: pi.title,
          portion_g: pi.portion_g,
          portion_text: pi.portion_text,
          kcal: pi.kcal ?? null,
          protein_g: pi.protein_g ?? null,
          fat_g: pi.fat_g ?? null,
          carbs_g: pi.carbs_g ?? null,
          fiber_g: pi.fiber_g ?? null,
          sugar_g: pi.sugar_g ?? null,
          sodium_mg: pi.sodium_mg ?? null,
          nutrition_source: 'model',
          origin: 'manual',
          position: pi.position,
          incomplete: false,
          updated_at: new Date().toISOString(),
        })) : [];

        const projectedMenu: MenuRead = {
          id: null,
          user_id: 'dev-bypass-user',
          date: menuDate,
          meal_type: pm.type,
          time: pm.time,
          status: 'planned',
          eaten_at: null,
          regenerations: 0,
          kcal_incomplete: false,
          pinned: Boolean(activePin),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: items,
        };
        deriveMenuState(projectedMenu);
        projected.push(projectedMenu);
      }
    }

    const allMenus = [...persisted, ...projected];

    // Compute available_pins for active pinned meals whose slot is not pinned in this day
    const availablePins: AvailablePin[] = [];
    for (const pm of mockPinnedMeals) {
      if (!pm.active) continue;
      const matchingMenu = allMenus.find((m) => m.meal_type === pm.meal_type);
      if (!matchingMenu || !matchingMenu.pinned) {
        availablePins.push({
          meal_type: pm.meal_type,
          pinned_meal_id: pm.id,
        });
      }
    }

    // GET returns 404 only when the profile has no meals and the day has nothing
    if (allMenus.length === 0 && mockProfile.meals.length === 0) {
      throw new ApiError('Not found', 404);
    }

    // Menus come ordered by time (null last), then slot
    allMenus.sort((a, b) => {
      if (a.time && b.time) {
        const cmp = a.time.localeCompare(b.time);
        if (cmp !== 0) return cmp;
      } else if (a.time) {
        return -1;
      } else if (b.time) {
        return 1;
      }
      return mealTypeOrder(a.meal_type) - mealTypeOrder(b.meal_type);
    });

    return {
      date: menuDate,
      menus: JSON.parse(JSON.stringify(allMenus)),
      notes: JSON.parse(JSON.stringify(mockNotes.filter((n) => n.date === menuDate))),
      off_plan: JSON.parse(JSON.stringify(mockOffPlan.filter((e) => e.date === menuDate))),
      kcal_incomplete: allMenus.some((m) => m.kcal_incomplete),
      can_generate_day: computeCanGenerateDay(allMenus),
      day_generation_replaces_manual: computeDayGenerationReplacesManual(allMenus),
      available_pins: availablePins,
    };
  },

  updateMenu: async (menuId: string, data: MenuUpdate): Promise<MenuRead> => {
    const menu = mockMenus.find((m) => m.id === menuId);
    if (!menu) {
      throw new ApiError('Menu not found', 404);
    }
    menu.eaten_at = data.eaten_at ?? null;
    deriveMenuState(menu);
    return JSON.parse(JSON.stringify(menu));
  },

  createMeal: async (menuDate: string, data: MealCreate): Promise<MenuRead> => {
    const slotLower = data.meal_type;
    const existsPersisted = mockMenus.some(
      (m) => (m.date === menuDate || !m.date) && m.meal_type === slotLower
    );
    const existsProjected = !mockDeletedSlots.has(`${menuDate}:${data.meal_type}`) &&
      mockProfile.meals.some((pm) => pm.type === slotLower);

    if (existsPersisted || existsProjected) {
      throw new ApiError(`Meal «${data.meal_type}» already exists`, 409);
    }

    mockDeletedSlots.delete(`${menuDate}:${data.meal_type}`);
    const newMenu: MenuRead = {
      id: `menu-${Date.now()}`,
      user_id: 'dev-bypass-user',
      date: menuDate,
      meal_type: data.meal_type,
      time: data.time.trim(),
      status: 'planned',
      eaten_at: null,
      regenerations: 0,
      kcal_incomplete: false,
      pinned: false,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockMenus.push(newMenu);
    return JSON.parse(JSON.stringify(newMenu));
  },

  deleteMeal: async (menuDate: string, slot: MealType): Promise<void> => {
    const slotLower = slot;
    const existing = mockMenus.find(
      (m) => (m.date === menuDate || !m.date) && m.meal_type === slotLower
    );

    if (existing && existing.status === 'eaten') {
      throw new ApiError('Не можна видалити зʼїдений прийом (спочатку зніміть позначку «з\'їдено»)', 409, {
        detail: 'Не можна видалити зʼїдений прийом (спочатку зніміть позначку «з\'їдено»)',
      });
    }

    if (existing && existing.pinned) {
      existing.pinned = false;
      existing.items = [];
      mockUnpinnedDaySlots.add(`${menuDate}:${slot}`);
      deriveMenuState(existing);
      return;
    }

    if (!existing) {
      const isUnpinned = mockUnpinnedDaySlots.has(`${menuDate}:${slot}`);
      const activePin = !isUnpinned && mockPinnedMeals.find((p) => p.active && p.meal_type === slotLower);
      if (activePin) {
        mockUnpinnedDaySlots.add(`${menuDate}:${slot}`);
        const pmSchedule = mockProfile.meals.find((p) => p.type === slotLower);
        const emptyMenu: MenuRead = {
          id: `menu-${Date.now()}`,
          user_id: 'dev-bypass-user',
          date: menuDate,
          meal_type: pmSchedule?.type || slot,
          time: pmSchedule?.time || null,
          status: 'planned',
          eaten_at: null,
          regenerations: 0,
          kcal_incomplete: false,
          pinned: false,
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockMenus.push(emptyMenu);
        return;
      }
    }

    mockDeletedSlots.add(`${menuDate}:${slot}`);
    mockUnpinnedDaySlots.delete(`${menuDate}:${slot}`);
    mockMenus = mockMenus.filter(
      (m) => !(m.date === menuDate && m.meal_type === slotLower) &&
             !(m.meal_type === slotLower)
    );
  },

  generateMenu: async (menuDate: string, data: GenerationRequest): Promise<GenerationResultRead> => {
    if (data.scope === 'slot' && data.meal_type) {
      const slotName = data.meal_type;
      let slotMenu: MenuRead;
      const existing = mockMenus.find((m) => m.meal_type === slotName.toLowerCase());
      if (existing && existing.status === 'eaten') {
        throw new ApiError(`Прийом «${mealTypeLabel(slotName)}» вже зʼїдено (спочатку зніміть позначку «з\'їдено»)`, 409);
      }

      // Simulate two-stage server processing
      await new Promise((resolve) => setTimeout(resolve, 3200));

      if (!existing) {
        slotMenu = {
          id: `menu-${Date.now()}`,
          user_id: 'dev-bypass-user',
          date: menuDate,
          meal_type: slotName,
          time: mockProfile.meals.find((pm) => pm.type === slotName)?.time || null,
          status: 'planned',
          eaten_at: null,
          regenerations: 0,
          kcal_incomplete: false,
          items: [
            {
              id: `item-${Date.now()}-1`,
              menu_id: `menu-${slotName}`,
              dish_id: slotName === 'lunch' ? 'dish-1' : null,
              title: slotName === 'lunch' ? 'Запечена форель з лимоном' : `Збалансована страва для «${mealTypeLabel(slotName)}»`,
              portion_g: 250,
              portion_text: null,
              kcal: 380,
              protein_g: 35,
              fat_g: 18,
              carbs_g: 12,
              fiber_g: 2,
              sugar_g: 1,
              sodium_mg: 320,
              nutrition_source: 'model',
              origin: 'generated',
              position: 0,
              incomplete: false,
              updated_at: new Date().toISOString(),
            },
            {
              id: `item-${Date.now()}-2`,
              menu_id: `menu-${slotName}`,
              dish_id: null,
              title: 'Огірки свіжі',
              portion_g: 150,
              portion_text: null,
              kcal: 25,
              protein_g: 1,
              fat_g: 0.2,
              carbs_g: 4,
              fiber_g: 1,
              sugar_g: 2,
              sodium_mg: 5,
              nutrition_source: 'model',
              origin: 'generated',
              position: 1,
              incomplete: false,
              updated_at: new Date().toISOString(),
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockMenus.push(slotMenu);
      } else {
        slotMenu = existing;
        if (!slotMenu.id) {
          slotMenu.id = `menu-${Date.now()}`;
        }
        slotMenu.regenerations += 1;
        const newItems: MenuItemRead[] = [
          {
            id: `item-${Date.now()}-1`,
            menu_id: slotMenu.id,
            dish_id: slotName === 'lunch' ? 'dish-1' : null,
            title: slotName === 'lunch' ? 'Запечена форель з овочами' : `Перерахована страва для «${mealTypeLabel(slotName)}» (вар. ${slotMenu.regenerations})`,
            portion_g: 280,
            portion_text: null,
            kcal: 410,
            protein_g: 36,
            fat_g: 19,
            carbs_g: 14,
            fiber_g: 3,
            sugar_g: 2,
            sodium_mg: 330,
            nutrition_source: 'model',
            origin: 'generated',
            position: 0,
            incomplete: false,
            updated_at: new Date().toISOString(),
          },
          {
            id: `item-${Date.now()}-2`,
            menu_id: slotMenu.id,
            dish_id: null,
            title: 'Салат зі свіжих огірків',
            portion_g: 120,
            portion_text: null,
            kcal: 30,
            protein_g: 1.2,
            fat_g: 0.3,
            carbs_g: 5,
            fiber_g: 1.5,
            sugar_g: 2,
            sodium_mg: 8,
            nutrition_source: 'model',
            origin: 'generated',
            position: 1,
            incomplete: false,
            updated_at: new Date().toISOString(),
          },
        ];
        slotMenu.items = newItems;
      }
      deriveMenuState(slotMenu);

      const dayResult = await mockNutritionApi.getDayMenus(menuDate);
      return {
        menus: dayResult.menus,
        rationale: `Окремо згенеровано прийом «${mealTypeLabel(slotName)}» з урахуванням цілей харчування.`,
        shopping_list: ['Свіжа зелень', 'Огірки свіжі'],
      };
    }

    const canGen = computeCanGenerateDay(mockMenus);
    if (!canGen) {
      throw new ApiError('Усі прийоми дня з\'їдено або закріплено', 409);
    }

    // Simulate two-stage server processing
    await new Promise((resolve) => setTimeout(resolve, 3200));

    for (const m of mockMenus) {
      if (!m.id) {
        m.id = `menu-${Date.now()}-${m.meal_type}`;
      }
      if (m.pinned || m.status === 'eaten') {
        continue;
      }
      m.regenerations += 1;
      const newItems: MenuItemRead[] = [
        {
          id: `item-${Date.now()}-${m.id}-1`,
          menu_id: m.id,
          dish_id: m.meal_type === 'lunch' ? 'dish-1' : null,
          title: `Страва для «${mealTypeLabel(m.meal_type)}» (вар. ${m.regenerations})`,
          portion_g: 250,
          portion_text: null,
          kcal: 350,
          protein_g: 25,
          fat_g: 12,
          carbs_g: 35,
          fiber_g: 3,
          sugar_g: 2,
          sodium_mg: 200,
          nutrition_source: 'model',
          origin: 'generated',
          position: 0,
          incomplete: false,
          updated_at: new Date().toISOString(),
        },
      ];
      m.items = newItems;
      deriveMenuState(m);
    }

    const fullDay = await mockNutritionApi.getDayMenus(menuDate);
    return {
      menus: fullDay.menus,
      rationale: 'Згенеровано з урахуванням залишку риби в холодильнику та обмеження щодо жирів (без жовчного міхура). Білковий обід і легка вечеря.',
      shopping_list: ['Оливкова олія', 'Сир кисломолочний 5%'],
    };
  },

  estimateMenu: async (menuDate: string, slot?: MealType): Promise<DayMenuRead> => {
    const targets = slot ? mockMenus.filter((m) => m.meal_type === slot) : mockMenus;
    for (const m of targets) {
      for (const it of m.items) {
        if (it.kcal === null || it.kcal === undefined) {
          it.kcal = it.portion_g ? Math.round(it.portion_g * 1.5) : 200;
          it.protein_g = 15;
          it.fat_g = 8;
          it.carbs_g = 20;
          it.nutrition_source = 'model';
        }
      }
      deriveMenuState(m);
    }
    return mockNutritionApi.getDayMenus(menuDate);
  },

  addMenuItem: async (_menuDate: string, slot: MealType, data: MenuItemCreate): Promise<MenuItemRead> => {
    let target = mockMenus.find((m) => (m.date === _menuDate || !m.date) && m.meal_type === slot);
    if (target && target.status === 'eaten') {
      throw new ApiError('Не можна додати позицію до завершеного прийому (спочатку зніміть позначку «з\'їдено»)', 409, {
        detail: 'Не можна додати позицію до завершеного прийому (спочатку зніміть позначку «з\'їдено»)',
      });
    }

    if (data.dish_id) {
      const d = mockDishes.find((dish) => dish.id === data.dish_id);
      if (d) {
        for (const comp of d.components) {
          const prod = mockProducts.find((p) => p.id === comp.product_id);
          if (prod && prod.stock_g !== null && prod.stock_g !== undefined) {
            const avail = prod.available_g ?? prod.stock_g;
            if (comp.weight_g > avail) {
              throw new ApiError(`Not enough available stock for product '${prod.name}'`, 409, {
                detail: `Not enough available stock for product '${prod.name}'`,
              });
            }
          }
        }
      }
    }

    if (!target) {
      const pm = mockProfile.meals.find((p) => p.type === slot);
      target = {
        id: `menu-${Date.now()}`,
        user_id: 'dev-bypass-user',
        date: _menuDate,
        meal_type: slot,
        time: pm?.time || null,
        status: 'planned',
        eaten_at: null,
        regenerations: 0,
        kcal_incomplete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: [],
      };
      mockMenus.push(target);
      mockDeletedSlots.delete(`${_menuDate}:${slot}`);
    }

    const linkedDish = data.dish_id ? mockDishes.find((d) => d.id === data.dish_id) : null;
    const itemKcal = data.kcal !== undefined && data.kcal !== null ? data.kcal : (linkedDish ? linkedDish.kcal : null);
    const nutSource: 'user' | 'model' | 'computed' | null =
      data.kcal !== undefined && data.kcal !== null
        ? 'user'
        : (linkedDish ? 'computed' : null);

    const newItem: MenuItemRead = {
      id: `item-${Date.now()}`,
      menu_id: target.id || `menu-${slot}`,
      dish_id: data.dish_id || null,
      title: data.title || (linkedDish ? linkedDish.name : 'Нова позиція'),
      portion_g: data.portion_g || null,
      portion_text: data.portion_text || null,
      kcal: itemKcal,
      protein_g: data.protein_g ?? (linkedDish ? linkedDish.protein_g : null),
      fat_g: data.fat_g ?? (linkedDish ? linkedDish.fat_g : null),
      carbs_g: data.carbs_g ?? (linkedDish ? linkedDish.carbs_g : null),
      fiber_g: data.fiber_g ?? (linkedDish ? linkedDish.fiber_g : null),
      sugar_g: data.sugar_g ?? (linkedDish ? linkedDish.sugar_g : null),
      sodium_mg: data.sodium_mg ?? (linkedDish ? linkedDish.sodium_mg : null),
      nutrition_source: nutSource,
      origin: 'manual',
      position: 99,
      incomplete: false,
      updated_at: new Date().toISOString(),
    };
    target.items.push(newItem);
    deriveMenuState(target);
    return JSON.parse(JSON.stringify(newItem));
  },

  updateMenuItem: async (itemId: string, data: MenuItemUpdate): Promise<MenuItemRead> => {
    for (const m of mockMenus) {
      const it = m.items.find((i) => i.id === itemId);
      if (it) {
        if (m.status === 'eaten') {
          throw new ApiError('Зʼїдений прийом їжі не можна редагувати (спочатку зніміть позначку «з\'їдено»)', 409, {
            detail: 'Зʼїдений прийом їжі не можна редагувати (спочатку зніміть позначку «з\'їдено»)',
          });
        }
        if (data.dish_id !== undefined) {
          it.dish_id = data.dish_id;
          if (data.dish_id) {
            it.incomplete = false;
            const d = mockDishes.find((dish) => dish.id === data.dish_id);
            if (d) {
              for (const comp of d.components) {
                const prod = mockProducts.find((p) => p.id === comp.product_id);
                if (prod && prod.stock_g !== null && prod.stock_g !== undefined) {
                  const avail = prod.available_g ?? prod.stock_g;
                  if (comp.weight_g > avail) {
                    throw new ApiError(`Not enough available stock for product '${prod.name}'`, 409, {
                      detail: `Not enough available stock for product '${prod.name}'`,
                    });
                  }
                }
              }
              if (data.title === undefined || data.title === null) {
                it.title = d.name;
              }
              it.kcal = d.kcal;
              it.protein_g = d.protein_g;
              it.fat_g = d.fat_g;
              it.carbs_g = d.carbs_g;
              it.nutrition_source = 'computed';
            }
          }
        }

        if (data.title !== undefined && data.title !== null) it.title = data.title;
        if (data.portion_g !== undefined) it.portion_g = data.portion_g;
        if (data.portion_text !== undefined) it.portion_text = data.portion_text;

        const incomingKcal = data.kcal;
        if (incomingKcal !== undefined) {
          it.kcal = incomingKcal;
          it.nutrition_source = incomingKcal !== null ? 'user' : null;
        }

        if (data.position !== undefined) it.position = data.position;
        it.updated_at = new Date().toISOString();
        deriveMenuState(m);
        return JSON.parse(JSON.stringify(it));
      }
    }
    throw new Error('Item not found');
  },

  deleteMenuItem: async (itemId: string): Promise<void> => {
    for (const m of mockMenus) {
      const it = m.items.find((i) => i.id === itemId);
      if (it) {
        if (m.status === 'eaten') {
          throw new ApiError('Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)', 409, {
            detail: 'Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)',
          });
        }
        const prevLen = m.items.length;
        m.items = m.items.filter((i) => i.id !== itemId);
        if (m.items.length !== prevLen) {
          deriveMenuState(m);
        }
        return;
      }
    }
  },

  getOffPlan: async (_menuDate: string): Promise<OffPlanEntryRead[]> => {
    return JSON.parse(JSON.stringify(mockOffPlan));
  },

  createOffPlan: async (data: OffPlanEntryCreate): Promise<OffPlanEntryRead> => {
    const entry: OffPlanEntryRead = {
      id: `op-${Date.now()}`,
      user_id: 'dev-bypass-user',
      date: data.date,
      at: data.at,
      text: data.text,
      kcal_est: data.kcal_est || null,
    };
    mockOffPlan.push(entry);
    return JSON.parse(JSON.stringify(entry));
  },

  deleteOffPlan: async (id: string): Promise<void> => {
    mockOffPlan = mockOffPlan.filter((e) => e.id !== id);
  },

  createMenuNote: async (_menuDate: string, data: MenuNoteCreate): Promise<MenuNoteRead> => {
    const note: MenuNoteRead = {
      id: `note-${Date.now()}`,
      user_id: 'dev-bypass-user',
      date: _menuDate,
      kind: data.kind,
      text: data.text,
      answer: data.kind === 'info'
        ? 'Виноград містить швидкі вуглеводи. Рекомендовано не більше 100-150 г у першій половині дня.'
        : 'Меню оновлено з урахуванням вашого коригування.',
      created_at: new Date().toISOString(),
    };
    mockNotes.push(note);
    return JSON.parse(JSON.stringify(note));
  },

  pinMeal: async (menuDate: string, slot: MealType): Promise<MenuRead> => {
    const slotLower = slot;
    const pinnedMeal = mockPinnedMeals.find((pm) => pm.meal_type === slotLower);
    if (!pinnedMeal) {
      throw new ApiError(`Закріплений прийом для «${mealTypeLabel(slot)}» не знайдено`, 404);
    }

    mockDeletedSlots.delete(`${menuDate}:${slot}`);
    mockUnpinnedDaySlots.delete(`${menuDate}:${slot}`);

    let menu = mockMenus.find(
      (m) => (m.date === menuDate || !m.date) && m.meal_type === slotLower
    );

    if (menu && menu.status === 'eaten') {
      throw new ApiError('Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)', 409, {
        detail: 'Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)',
      });
    }

    const pmSchedule = mockProfile.meals.find((p) => p.type === slotLower);
    const time = menu?.time || pmSchedule?.time || null;

    const pinnedItems: MenuItemRead[] = pinnedMeal.items.map((pi, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      menu_id: menu?.id || `menu-${slot}`,
      dish_id: pi.dish_id,
      title: pi.title,
      portion_g: pi.portion_g,
      portion_text: pi.portion_text,
      kcal: pi.kcal ?? null,
      protein_g: pi.protein_g ?? null,
      fat_g: pi.fat_g ?? null,
      carbs_g: pi.carbs_g ?? null,
      fiber_g: pi.fiber_g ?? null,
      sugar_g: pi.sugar_g ?? null,
      sodium_mg: pi.sodium_mg ?? null,
      nutrition_source: 'user',
      origin: 'manual',
      position: pi.position,
      incomplete: false,
      updated_at: new Date().toISOString(),
    }));

    if (menu) {
      menu.pinned = true;
      menu.items = [...pinnedItems];
      deriveMenuState(menu);
    } else {
      menu = {
        id: `menu-${Date.now()}`,
        user_id: 'dev-bypass-user',
        date: menuDate,
        meal_type: slot,
        time: time,
        status: 'planned',
        eaten_at: null,
        regenerations: 0,
        kcal_incomplete: false,
        pinned: true,
        items: pinnedItems,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      deriveMenuState(menu);
      mockMenus.push(menu);
    }

    return JSON.parse(JSON.stringify(menu));
  },

  getPinnedMeals: async (): Promise<PinnedMealRead[]> => {
    return JSON.parse(JSON.stringify(mockPinnedMeals));
  },

  upsertPinnedMeal: async (slot: MealType, data: PinnedMealUpsert): Promise<PinnedMealRead> => {
    const slotTrimmed = slot;
    const inSchedule = mockProfile.meals.some(
      (m) => m.type === slotTrimmed
    );
    if (!inSchedule) {
      throw new ApiError(`Прийом «${mealTypeLabel(slot)}» відсутній у розкладі профілю`, 400);
    }

    for (const item of data.items) {
      if (!item.dish_id && (!item.title || !item.title.trim())) {
        throw new ApiError('Для вільного запису обовʼязкова назва', 400);
      }
    }

    let existing = mockPinnedMeals.find(
      (pm) => pm.meal_type === slotTrimmed
    );

    const now = new Date().toISOString();
    const formattedItems: PinnedMealItemRead[] = data.items.map((it, idx) => {
      const linkedDish = it.dish_id ? mockDishes.find((d) => d.id === it.dish_id) : null;
      const kcalVal = it.kcal !== undefined && it.kcal !== null ? it.kcal : (linkedDish ? linkedDish.kcal : null);
      return {
        id: `pin-item-${Date.now()}-${idx}`,
        pinned_meal_id: existing?.id || `pin-${Date.now()}`,
        dish_id: it.dish_id || null,
        title: it.title?.trim() || (linkedDish ? linkedDish.name : 'Позиція'),
        portion_g: it.portion_g !== undefined ? it.portion_g : null,
        portion_text: it.portion_text?.trim() || null,
        kcal: kcalVal,
        protein_g: it.protein_g ?? (linkedDish ? linkedDish.protein_g : null),
        fat_g: it.fat_g ?? (linkedDish ? linkedDish.fat_g : null),
        carbs_g: it.carbs_g ?? (linkedDish ? linkedDish.carbs_g : null),
        fiber_g: it.fiber_g ?? (linkedDish ? linkedDish.fiber_g : null),
        sugar_g: it.sugar_g ?? (linkedDish ? linkedDish.sugar_g : null),
        sodium_mg: it.sodium_mg ?? (linkedDish ? linkedDish.sodium_mg : null),
        position: it.position ?? idx,
      };
    });

    if (existing) {
      existing.active = data.active;
      existing.items = formattedItems;
      existing.updated_at = now;
    } else {
      existing = {
        id: `pin-${Date.now()}`,
        meal_type: slotTrimmed,
        active: data.active,
        items: formattedItems,
        created_at: now,
        updated_at: now,
      };
      mockPinnedMeals.push(existing);
    }

    return JSON.parse(JSON.stringify(existing));
  },

  deletePinnedMeal: async (slot: MealType): Promise<void> => {
    mockPinnedMeals = mockPinnedMeals.filter(
      (pm) => pm.meal_type !== slot
    );
  },
};
