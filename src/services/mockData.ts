import { ApiError } from './api';
import { formatLocalDate } from '../utils/date';
import type {
  NutritionProfileRead,
  NutritionProfileUpsert,
  ProductRead,
  ProductCreate,
  ProductUpdate,
  RecipeRead,
  RecipeCreate,
  RecipeUpdate,
  FrequentDishRead,
  FrequentDishCreate,
  FrequentDishUpdate,
  FrequentDishCookRequest,
  DishRead,
  DishCreate,
  DishUpdate,
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
    name: 'Яйця курячі',
    available: true,
    availability: 'in_stock',
    preference: 'neutral',
    eat_raw: false,
    count: 10,
    stock_g: 500,
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
    available: true,
    availability: 'in_stock',
    preference: 'preferred',
    eat_raw: false,
    count: null,
    stock_g: 800,
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
];

let mockRecipes: RecipeRead[] = [
  {
    id: 'recipe-1',
    user_id: 'dev-bypass-user',
    name: 'Запечена форель з лимоном',
    archived: false,
    product_ids: ['prod-1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockFrequentDishes: FrequentDishRead[] = [
  {
    id: 'freq-1',
    user_id: 'dev-bypass-user',
    recipe_id: 'recipe-1',
    recipe_name: 'Запечена форель з лимоном',
    cooked_weight_g: 250,
    nutrition_overridden: false,
    kcal: 185,
    protein_g: 17.0,
    fat_g: 5.5,
    carbs_g: 18.0,
    fiber_g: 2.5,
    sugar_g: 2.0,
    sodium_mg: 50,
    components: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockDishes: DishRead[] = [
  {
    id: 'dish-1',
    user_id: 'dev-bypass-user',
    name: 'Борщ',
    recipe_id: 'recipe-1',
    cooked_weight_g: 350,
    remaining_g: 350,
    is_ready: true,
    kcal: 120,
    protein_g: 8,
    fat_g: 4,
    carbs_g: 14,
    fiber_g: 3,
    sugar_g: 2,
    sodium_mg: 300,
    components: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dish-2',
    user_id: 'dev-bypass-user',
    name: 'Омлет із 4 яєць',
    cooked_weight_g: 200,
    remaining_g: 200,
    is_ready: true,
    kcal: 280,
    protein_g: 24,
    fat_g: 19,
    carbs_g: 2,
    fiber_g: 0,
    sugar_g: 1,
    sodium_mg: 280,
    components: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockMeals: MenuRead[] = [
  {
    id: 'meal-1',
    user_id: 'dev-bypass-user',
    date: formatLocalDate(),
    meal_type: 'breakfast',
    origin: 'manual',
    state: 'eaten',
    eaten_at: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        menu_id: 'meal-1',
        dish_id: 'dish-2',
        title: 'Омлет із 4 яєць',
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
        origin: 'manual',
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    evaluations: [
      {
        criterion_key: 'balance',
        choice: 'green',
        level: 'green',
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockCurrentSuggestion: MenuRead | null = {
  id: 'sugg-1',
  user_id: 'dev-bypass-user',
  date: formatLocalDate(),
  meal_type: 'lunch',
  origin: 'suggestion',
  state: 'suggestion',
  eaten_at: null,
  items: [
    {
      id: 'sugg-item-1',
      menu_id: 'sugg-1',
      dish_id: 'dish-1',
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
      id: 'sugg-item-2',
      menu_id: 'sugg-1',
      dish_id: null,
      title: 'Омлет із 4 яєць',
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
      available: data.available ?? true,
      availability: data.availability || 'in_stock',
      preference: data.preference || 'neutral',
      eat_raw: Boolean(data.eat_raw),
      count: data.count || null,
      stock_g: data.stock_g ?? null,
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
      return JSON.parse(JSON.stringify(item));
    }
    throw new ApiError('Product not found', 404);
  },

  estimateProduct: async (productId: string): Promise<ProductRead> => {
    const item = mockProducts.find((p) => p.id === productId);
    if (!item) throw new ApiError('Product not found', 404);
    item.kcal = 125;
    item.protein_g = 6.0;
    item.fat_g = 3.5;
    item.carbs_g = 15.0;
    item.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(item));
  },

  deleteProduct: async (productId: string): Promise<void> => {
    mockProducts = mockProducts.filter((p) => p.id !== productId);
  },

  // Recipes
  getRecipes: async (includeArchived = false): Promise<RecipeRead[]> => {
    let result = mockRecipes;
    if (!includeArchived) {
      result = result.filter((r) => !r.archived);
    }
    return JSON.parse(JSON.stringify(result));
  },

  getRecipe: async (recipeId: string): Promise<RecipeRead> => {
    const r = mockRecipes.find((recipe) => recipe.id === recipeId);
    if (!r) throw new ApiError('Recipe not found', 404);
    return JSON.parse(JSON.stringify(r));
  },

  createRecipe: async (data: RecipeCreate): Promise<RecipeRead> => {
    const item: RecipeRead = {
      id: `recipe-${Date.now()}`,
      user_id: 'dev-bypass-user',
      name: data.name,
      archived: false,
      product_ids: data.product_ids || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockRecipes.push(item);
    return JSON.parse(JSON.stringify(item));
  },

  updateRecipe: async (recipeId: string, data: RecipeUpdate): Promise<RecipeRead> => {
    const r = mockRecipes.find((recipe) => recipe.id === recipeId);
    if (!r) throw new ApiError('Recipe not found', 404);
    if (data.name !== undefined) r.name = data.name;
    if (data.archived !== undefined) r.archived = data.archived;
    r.updated_at = new Date().toISOString();
    return JSON.parse(JSON.stringify(r));
  },

  deleteRecipe: async (recipeId: string): Promise<void> => {
    mockRecipes = mockRecipes.filter((r) => r.id !== recipeId);
  },

  // Frequent Dishes
  getFrequentDishes: async (): Promise<FrequentDishRead[]> => {
    return JSON.parse(JSON.stringify(mockFrequentDishes));
  },

  getFrequentDish: async (id: string): Promise<FrequentDishRead> => {
    const fd = mockFrequentDishes.find((f) => f.id === id);
    if (!fd) throw new ApiError('Frequent dish not found', 404);
    return JSON.parse(JSON.stringify(fd));
  },

  createFrequentDish: async (data: FrequentDishCreate): Promise<FrequentDishRead> => {
    const fdId = `freq-${Date.now()}`;
    const item: FrequentDishRead = {
      id: fdId,
      user_id: 'dev-bypass-user',
      recipe_id: data.recipe_id,
      recipe_name: 'Страва',
      cooked_weight_g: data.cooked_weight_g,
      nutrition_overridden: false,
      kcal: data.kcal ?? 200,
      protein_g: data.protein_g ?? 15,
      fat_g: data.fat_g ?? 8,
      carbs_g: data.carbs_g ?? 20,
      fiber_g: data.fiber_g ?? 2,
      sugar_g: data.sugar_g ?? 1,
      sodium_mg: data.sodium_mg ?? 50,
      components: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockFrequentDishes.unshift(item);
    return JSON.parse(JSON.stringify(item));
  },

  updateFrequentDish: async (id: string, data: FrequentDishUpdate): Promise<FrequentDishRead> => {
    const fd = mockFrequentDishes.find((f) => f.id === id);
    if (!fd) throw new ApiError('Frequent dish not found', 404);
    Object.assign(fd, data, { updated_at: new Date().toISOString() });
    return JSON.parse(JSON.stringify(fd));
  },

  deleteFrequentDish: async (id: string): Promise<void> => {
    mockFrequentDishes = mockFrequentDishes.filter((f) => f.id !== id);
  },

  cookFrequentDish: async (id: string, _data: FrequentDishCookRequest): Promise<DishRead> => {
    const fd = mockFrequentDishes.find((f) => f.id === id);
    if (!fd) throw new ApiError('Frequent dish not found', 404);
    const cookedDish: DishRead = {
      id: `dish-${Date.now()}`,
      user_id: 'dev-bypass-user',
      name: fd.recipe_name,
      cooked_weight_g: fd.cooked_weight_g,
      remaining_g: fd.cooked_weight_g,
      is_ready: true,
      kcal: fd.kcal,
      protein_g: fd.protein_g,
      fat_g: fd.fat_g,
      carbs_g: fd.carbs_g,
      fiber_g: fd.fiber_g,
      sugar_g: fd.sugar_g,
      sodium_mg: fd.sodium_mg,
      components: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDishes.unshift(cookedDish);
    return JSON.parse(JSON.stringify(cookedDish));
  },

  // Dishes
  getDishes: async (available?: boolean): Promise<DishRead[]> => {
    let result = mockDishes;
    if (available) {
      result = result.filter((d) => (d.remaining_g ?? 0) > 0 || d.is_ready);
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
    const cookedDish: DishRead = {
      id: dishId,
      user_id: 'dev-bypass-user',
      name: data.name || 'Нова страва',
      cooked_weight_g: data.cooked_weight_g ?? 250,
      remaining_g: data.remaining_g ?? data.cooked_weight_g ?? 250,
      is_ready: data.is_ready ?? true,
      kcal: data.kcal ?? 150,
      protein_g: data.protein_g ?? 10,
      fat_g: data.fat_g ?? 5,
      carbs_g: data.carbs_g ?? 15,
      fiber_g: data.fiber_g ?? 1,
      sugar_g: data.sugar_g ?? 1,
      sodium_mg: data.sodium_mg ?? 50,
      components: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDishes.unshift(cookedDish);
    return JSON.parse(JSON.stringify(cookedDish));
  },

  updateDish: async (dishId: string, data: DishUpdate): Promise<DishRead> => {
    const dish = mockDishes.find((d) => d.id === dishId);
    if (!dish) throw new ApiError('Dish not found', 404);
    Object.assign(dish, data, { updated_at: new Date().toISOString() });
    return JSON.parse(JSON.stringify(dish));
  },

  deleteDish: async (dishId: string): Promise<void> => {
    mockDishes = mockDishes.filter((d) => d.id !== dishId);
  },

  // Suggestions & Journal API
  createSuggestion: async (data: SuggestionRequest): Promise<SuggestionResponse> => {
    if (data.text && (data.text.includes('з\'їв') || data.text.includes('зїв'))) {
      const loggedMeal: MenuRead = {
        id: `meal-${Date.now()}`,
        user_id: 'dev-bypass-user',
        date: data.date,
        meal_type: 'snack' as unknown as any,
        origin: 'manual',
        state: 'eaten',
        eaten_at: data.at,
        items: [
          {
            id: `item-${Date.now()}`,
            menu_id: `meal-${Date.now()}`,
            dish_id: null,
            title: data.text,
            portion_g: 150,
            portion_text: '150 г',
            kcal: 180,
            protein_g: 12,
            fat_g: 6,
            carbs_g: 18,
            fiber_g: 1,
            sugar_g: 1,
            sodium_mg: 100,
            nutrition_source: 'model',
            origin: 'manual',
            position: 0,
            updated_at: new Date().toISOString(),
          },
        ],
        evaluations: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockMeals.push(loggedMeal);
      return { intent: 'log', menu: loggedMeal };
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
          dish_id: 'dish-1',
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
          dish_id: 'dish-2',
          title: 'Омлет із 4 яєць',
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
    return { intent: 'suggest', menu: sugg };
  },

  eatMeal: async (menuId: string, data: EatMealRequest): Promise<MenuRead> => {
    let meal = mockCurrentSuggestion?.id === menuId ? mockCurrentSuggestion : null;
    if (!meal) {
      meal = mockMeals.find((m) => m.id === menuId) || null;
    }
    if (!meal) throw new ApiError('Meal not found', 404);
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
      suggestion: JSON.parse(JSON.stringify(mockCurrentSuggestion)),
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
