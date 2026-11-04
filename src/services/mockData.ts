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
  MealType,
  MenuRead,
  MenuItemRead,
  MenuItemUpdate,
  SuggestionRequest,
  SuggestionResponse,
  EatMealRequest,
  JournalResponse,
} from '../types/nutrition';

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
  weight_variety: 0.5,
  weight_balance: 0.5,
  weight_goal: 0.5,
  updated_at: new Date().toISOString(),
};

let mockProducts: ProductRead[] = [
  {
    id: 'prod-1',
    user_id: 'dev-bypass-user',
    name: 'Яйця',
    available: true,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    user_id: 'dev-bypass-user',
    name: 'Твердий сир',
    available: true,
    note: 'домашній, жирний',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    user_id: 'dev-bypass-user',
    name: 'Макарони',
    available: true,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    user_id: 'dev-bypass-user',
    name: 'Яблука',
    available: true,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    user_id: 'dev-bypass-user',
    name: 'Куряче філе',
    available: false,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    user_id: 'dev-bypass-user',
    name: 'Свиняча вирізка',
    available: false,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    user_id: 'dev-bypass-user',
    name: 'Рис',
    available: false,
    note: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockDishes: DishRead[] = [
  {
    id: 'dish-1',
    user_id: 'dev-bypass-user',
    name: 'Звичайний сніданок',
    is_ready: true,
    pinned_meal_type: 'breakfast',
    nutrition_overridden: true,
    note: null,
    cooked_weight_g: 350,
    kcal: 410,
    protein_g: 32,
    fat_g: 14,
    carbs_g: 38,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    components: [
      { id: 'comp-1-1', dish_id: 'dish-1', name: 'Вівсяні пластівці', weight_g: 60 },
      { id: 'comp-1-2', dish_id: 'dish-1', name: 'Молоко 2.5%', weight_g: 150 },
      { id: 'comp-1-3', dish_id: 'dish-1', name: 'Банан', weight_g: 100 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dish-2',
    user_id: 'dev-bypass-user',
    name: 'Борщ',
    is_ready: true,
    pinned_meal_type: null,
    nutrition_overridden: false,
    note: null,
    cooked_weight_g: null,
    kcal: 35,
    protein_g: 1.5,
    fat_g: 1.2,
    carbs_g: 4.8,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    components: [
      { id: 'comp-2-1', dish_id: 'dish-2', name: 'Буряк', weight_g: 150 },
      { id: 'comp-2-2', dish_id: 'dish-2', name: 'Капуста білокачанна', weight_g: 200 },
      { id: 'comp-2-3', dish_id: 'dish-2', name: 'Картопля', weight_g: 150 },
      { id: 'comp-2-4', dish_id: 'dish-2', name: 'Яловичина', weight_g: 200 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dish-3',
    user_id: 'dev-bypass-user',
    name: 'Каша гречана',
    is_ready: true,
    pinned_meal_type: null,
    nutrition_overridden: false,
    note: null,
    cooked_weight_g: null,
    kcal: 115.2,
    protein_g: 4.2,
    fat_g: 1.1,
    carbs_g: 22.3,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    components: [
      { id: 'comp-3-1', dish_id: 'dish-3', name: 'Гречана крупа', weight_g: 100 },
      { id: 'comp-3-2', dish_id: 'dish-3', name: 'Вершкове масло', weight_g: 10 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dish-4',
    user_id: 'dev-bypass-user',
    name: 'Омлет',
    is_ready: false,
    pinned_meal_type: null,
    nutrition_overridden: false,
    note: null,
    cooked_weight_g: null,
    kcal: 155,
    protein_g: 13,
    fat_g: 11,
    carbs_g: 1.5,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    components: [
      { id: 'comp-4-1', dish_id: 'dish-4', name: 'Яйця', weight_g: 110 },
      { id: 'comp-4-2', dish_id: 'dish-4', name: 'Молоко 2.5%', weight_g: 50 },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dish-5',
    user_id: 'dev-bypass-user',
    name: 'Запечена риба',
    is_ready: false,
    pinned_meal_type: null,
    nutrition_overridden: false,
    note: null,
    cooked_weight_g: null,
    kcal: 130,
    protein_g: 20,
    fat_g: 5,
    carbs_g: 0,
    fiber_g: null,
    sugar_g: null,
    sodium_mg: null,
    components: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockCurrentSuggestion: MenuRead | null = null;
let mockMeals: MenuRead[] = [];

export const mockNutritionApi = {
  // Profile
  getProfile: async (): Promise<NutritionProfileRead | null> => {
    return JSON.parse(JSON.stringify(mockProfile));
  },

  upsertProfile: async (data: NutritionProfileUpsert): Promise<NutritionProfileRead> => {
    mockProfile = {
      ...mockProfile,
      ...data,
      weight_variety: data.weight_variety ?? 0.5,
      weight_balance: data.weight_balance ?? 0.5,
      weight_goal: data.weight_goal ?? 0.5,
      updated_at: new Date().toISOString(),
    };
    return JSON.parse(JSON.stringify(mockProfile));
  },

  // Products
  getProducts: async (): Promise<ProductRead[]> => {
    return JSON.parse(JSON.stringify(mockProducts));
  },

  createProduct: async (data: ProductCreate): Promise<ProductRead> => {
    const item: ProductRead = {
      id: `prod-${Date.now()}`,
      user_id: 'dev-bypass-user',
      name: data.name,
      available: data.available ?? true,
      note: data.note ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockProducts.unshift(item);
    return JSON.parse(JSON.stringify(item));
  },

  updateProduct: async (productId: string, data: ProductUpdate): Promise<ProductRead> => {
    const p = mockProducts.find((item) => item.id === productId);
    if (!p) throw new ApiError('Product not found', 404);
    Object.assign(p, data, { updated_at: new Date().toISOString() });
    return JSON.parse(JSON.stringify(p));
  },

  deleteProduct: async (productId: string): Promise<void> => {
    mockProducts = mockProducts.filter((item) => item.id !== productId);
  },

  // Dishes
  getDishes: async (isReady?: boolean, pinnedMealType?: MealType | null): Promise<DishRead[]> => {
    let result = mockDishes;
    if (isReady !== undefined) {
      result = result.filter((d) => d.is_ready === isReady);
    }
    if (pinnedMealType !== undefined && pinnedMealType !== null) {
      result = result.filter((d) => d.pinned_meal_type === pinnedMealType);
    }
    return JSON.parse(JSON.stringify(result));
  },

  getDish: async (dishId: string): Promise<DishRead> => {
    const dish = mockDishes.find((d) => d.id === dishId);
    if (dish) return JSON.parse(JSON.stringify(dish));
    throw new ApiError('Dish not found', 404);
  },

  createDish: async (data: DishCreate): Promise<DishRead> => {
    const dishId = `dish-${Date.now()}`;
    const newDish: DishRead = {
      id: dishId,
      user_id: 'dev-bypass-user',
      name: data.name || 'Нова страва',
      is_ready: data.is_ready ?? false,
      pinned_meal_type: data.pinned_meal_type ?? null,
      nutrition_overridden: data.nutrition_overridden ?? false,
      note: data.note ?? null,
      cooked_weight_g: data.cooked_weight_g ?? null,
      kcal: data.kcal ?? 160,
      protein_g: data.protein_g ?? 12,
      fat_g: data.fat_g ?? 6,
      carbs_g: data.carbs_g ?? 14,
      fiber_g: data.fiber_g ?? null,
      sugar_g: data.sugar_g ?? null,
      sodium_mg: data.sodium_mg ?? null,
      components: (data.components || []).map((c, idx) => ({
        id: `comp-${Date.now()}-${idx}`,
        dish_id: dishId,
        name: c.name,
        weight_g: c.weight_g,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDishes.unshift(newDish);
    return JSON.parse(JSON.stringify(newDish));
  },

  updateDish: async (dishId: string, data: DishUpdate): Promise<DishRead> => {
    const dish = mockDishes.find((d) => d.id === dishId);
    if (!dish) throw new ApiError('Dish not found', 404);
    const { components, is_ready, nutrition_overridden, reset_nutrition, ...rest } = data;
    const updates: Partial<DishRead> = { ...rest };
    if (is_ready !== null && is_ready !== undefined) {
      updates.is_ready = is_ready;
    }
    if (reset_nutrition) {
      updates.nutrition_overridden = false;
      if (dish.components && dish.components.length > 0) {
        updates.kcal = 150;
        updates.protein_g = 8;
        updates.fat_g = 5;
        updates.carbs_g = 18;
      } else {
        updates.kcal = 100;
        updates.protein_g = 5;
        updates.fat_g = 3;
        updates.carbs_g = 12;
      }
    } else if (nutrition_overridden !== null && nutrition_overridden !== undefined) {
      updates.nutrition_overridden = nutrition_overridden;
    }
    if (
      !reset_nutrition &&
      (data.kcal !== undefined ||
        data.protein_g !== undefined ||
        data.fat_g !== undefined ||
        data.carbs_g !== undefined)
    ) {
      updates.nutrition_overridden = true;
    }
    if (components !== undefined) {
      updates.components = components.map((c, idx) => ({
        id: `comp-${Date.now()}-${idx}`,
        dish_id: dishId,
        name: c.name,
        weight_g: c.weight_g,
      }));
    }
    Object.assign(dish, updates, { updated_at: new Date().toISOString() });
    return JSON.parse(JSON.stringify(dish));
  },

  deleteDish: async (dishId: string): Promise<void> => {
    mockDishes = mockDishes.filter((d) => d.id !== dishId);
  },

  // Suggestions & Journal API
  createSuggestion: async (data: SuggestionRequest): Promise<SuggestionResponse> => {
    const mode = data.mode ?? 'suggest';
    if (mode === 'log') {
      const text = data.text?.trim() || 'Прийом їжі';
      const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
      const items = parts.length > 1
        ? parts.map((part, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            menu_id: `meal-${Date.now()}`,
            dish_id: null,
            title: part,
            portion_g: 150,
            portion_text: '150 г',
            kcal: 150,
            protein_g: 15,
            fat_g: 5,
            carbs_g: 15,
            fiber_g: 1,
            sugar_g: 1,
            sodium_mg: 100,
            nutrition_source: 'model' as const,
            origin: 'manual' as const,
            position: idx,
            updated_at: new Date().toISOString(),
          }))
        : [
            {
              id: `item-${Date.now()}`,
              menu_id: `meal-${Date.now()}`,
              dish_id: null,
              title: text,
              portion_g: 150,
              portion_text: '150 г',
              kcal: 180,
              protein_g: 12,
              fat_g: 6,
              carbs_g: 18,
              fiber_g: 1,
              sugar_g: 1,
              sodium_mg: 100,
              nutrition_source: 'model' as const,
              origin: 'manual' as const,
              position: 0,
              updated_at: new Date().toISOString(),
            },
          ];

      const loggedMeal: MenuRead = {
        id: `meal-${Date.now()}`,
        user_id: 'dev-bypass-user',
        date: data.date,
        meal_type: 'afternoon_snack',
        origin: 'manual',
        state: 'eaten',
        eaten_at: data.at,
        items,
        evaluations: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockMeals.push(loggedMeal);
      return { mode: 'log', menu: loggedMeal };
    }

    const sugg: MenuRead = {
      id: `sugg-${Date.now()}`,
      user_id: 'dev-bypass-user',
      date: data.date,
      meal_type: 'lunch',
      origin: 'suggestion',
      state: 'suggestion',
      eaten_at: null,
      items: [
        {
          id: `item-${Date.now()}-1`,
          menu_id: `sugg-${Date.now()}`,
          dish_id: 'dish-2',
          title: 'Борщ',
          portion_g: 350,
          portion_text: '350 г',
          kcal: 250,
          protein_g: 12,
          fat_g: 8,
          carbs_g: 30,
          fiber_g: 4,
          sugar_g: 5,
          sodium_mg: 400,
          nutrition_source: 'model',
          origin: 'generated',
          position: 0,
          updated_at: new Date().toISOString(),
        },
        {
          id: `item-${Date.now()}-2`,
          menu_id: `sugg-${Date.now()}`,
          dish_id: 'dish-4',
          title: 'Омлет',
          portion_g: 200,
          portion_text: '200 г',
          kcal: 280,
          protein_g: 24,
          fat_g: 19,
          carbs_g: 2,
          fiber_g: 0,
          sugar_g: 1,
          sodium_mg: 280,
          nutrition_source: 'model',
          origin: 'generated',
          position: 1,
          updated_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockCurrentSuggestion = sugg;
    return { mode: 'suggest', menu: sugg };
  },

  eatMeal: async (menuId: string, data: EatMealRequest): Promise<MenuRead> => {
    let meal = mockCurrentSuggestion?.id === menuId ? mockCurrentSuggestion : null;
    if (!meal) {
      meal = mockMeals.find((m) => m.id === menuId) || null;
    }
    if (!meal) throw new ApiError('Meal not found', 404);
    if (meal.date && meal.date !== data.date) {
      throw new ApiError('Неможливо зберегти пропозицію іншого дня', 409);
    }
    meal.state = 'eaten';
    meal.eaten_at = data.at;
    meal.date = data.date;
    mockMeals.push(meal);
    if (mockCurrentSuggestion?.id === menuId) {
      mockCurrentSuggestion = null;
    }
    return JSON.parse(JSON.stringify(meal));
  },

  getJournal: async (date: string): Promise<JournalResponse> => {
    const dayMeals = mockMeals.filter((m) => m.date === date && m.state === 'eaten');
    let totalKcal = 0;
    let totalProtein = 0;
    for (const m of dayMeals) {
      for (const it of m.items) {
        totalKcal += it.kcal ?? 0;
        totalProtein += it.protein_g ?? 0;
      }
    }
    return {
      date,
      meals: JSON.parse(JSON.stringify(dayMeals)),
      suggestion:
        mockCurrentSuggestion?.date === date ? JSON.parse(JSON.stringify(mockCurrentSuggestion)) : null,
      totals: {
        kcal: Math.round(totalKcal),
        protein_g: Math.round(totalProtein),
      },
      norms: {
        kcal: 1900,
        protein_g: 130,
      },
      day_evaluations: [
        {
          key: 'goal',
          title: 'Мета',
          level: 'green',
          confidence: 0.95,
          criteria_version: 1,
          evaluated_at: new Date().toISOString(),
          menu_id: null,
        },
      ],
    };
  },

  deleteMeal: async (menuId: string): Promise<void> => {
    mockMeals = mockMeals.filter((m) => m.id !== menuId);
    if (mockCurrentSuggestion?.id === menuId) {
      mockCurrentSuggestion = null;
    }
  },

  updateMenuItem: async (itemId: string, data: MenuItemUpdate): Promise<MenuItemRead> => {
    for (const m of [...mockMeals, ...(mockCurrentSuggestion ? [mockCurrentSuggestion] : [])]) {
      const it = m.items.find((i) => i.id === itemId);
      if (it) {
        if (data.portion_g !== undefined) {
          const ratio = (data.portion_g ?? 100) / (it.portion_g || 100);
          it.portion_g = data.portion_g;
          it.portion_text = data.portion_g ? `${data.portion_g} г` : it.portion_text;
          if (it.kcal !== null) it.kcal = Math.round(it.kcal * ratio);
          if (it.protein_g !== null) it.protein_g = Math.round(it.protein_g * ratio * 10) / 10;
        }
        it.updated_at = new Date().toISOString();
        return JSON.parse(JSON.stringify(it));
      }
    }
    throw new ApiError('Item not found', 404);
  },
};
