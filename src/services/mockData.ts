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
  meals: [
    { name: 'Сніданок', time: '08:30' },
    { name: 'Обід', time: '13:30' },
    { name: 'Вечеря', time: '19:00' },
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
    daily_limit_g: null,
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
    daily_limit_g: 60,
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
    daily_limit_g: null,
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
    daily_limit_g: 30,
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
    daily_limit_g: null,
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
    fixed_slot: null,
    notes: 'Свіжа риба на 2 дні',
    components: [
      { id: 'comp-1', dish_id: 'dish-1', name: 'Форель', raw_weight_g: 700, cooked_weight_g: 600 },
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
    fixed_slot: 'Сніданок',
    notes: 'Постійна ранкова страва',
    components: [
      { id: 'comp-2', dish_id: 'dish-2', name: 'Вівсянка суха', raw_weight_g: 45, cooked_weight_g: null },
      { id: 'comp-3', dish_id: 'dish-2', name: 'Кисломолочний сир 5%', raw_weight_g: 150, cooked_weight_g: null },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockPinnedMeals: PinnedMealRead[] = [
  {
    id: 'pin-1',
    slot: 'Сніданок',
    active: true,
    items: [
      {
        id: 'pin-item-1',
        dish_id: 'dish-2',
        product_id: null,
        title: 'Ранкова вівсянка з сиром',
        portion_g: 250,
        portion_text: null,
        kcal_est: 420,
        position: 0,
      },
      {
        id: 'pin-item-2',
        dish_id: null,
        product_id: 'prod-5',
        title: 'Яблука Голден',
        portion_g: null,
        portion_text: '1 шт',
        kcal_est: 75,
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
    slot: 'Сніданок',
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
        product_id: null,
        title: 'Ранкова вівсянка з сиром',
        portion_g: 250,
        portion_text: null,
        kcal_est: 420,
        kcal_source: 'model',
        origin: 'generated',
        position: 0,
        incomplete: false,
      },
      {
        id: 'item-1b',
        menu_id: 'menu-1',
        dish_id: null,
        product_id: 'prod-5',
        title: 'Яблука Голден',
        portion_g: null,
        portion_text: '1 шт',
        kcal_est: 75,
        kcal_source: 'model',
        origin: 'generated',
        position: 1,
        incomplete: false,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'menu-2',
    user_id: 'dev-bypass-user',
    date: new Date().toISOString().slice(0, 10),
    slot: 'Обід',
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
        product_id: null,
        title: 'Запечена форель з лимоном',
        portion_g: 250,
        portion_text: null,
        kcal_est: 380,
        kcal_source: 'model',
        origin: 'generated',
        position: 0,
        incomplete: false,
      },
      {
        id: 'item-3',
        menu_id: 'menu-2',
        dish_id: null,
        product_id: 'prod-3',
        title: 'Помідори чері',
        portion_g: 150,
        portion_text: null,
        kcal_est: 35,
        kcal_source: 'user',
        origin: 'manual',
        position: 1,
        incomplete: false,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'menu-3',
    user_id: 'dev-bypass-user',
    date: new Date().toISOString().slice(0, 10),
    slot: 'Вечеря',
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
        product_id: 'prod-1',
        title: 'Омлет з 2 яєць',
        portion_g: null,
        portion_text: '2 шт',
        kcal_est: 190,
        kcal_source: 'model',
        origin: 'generated',
        position: 0,
        incomplete: false,
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
    (i) => i.kcal_est === null || i.kcal_est === undefined
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
      daily_limit_g: data.daily_limit_g || null,
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
    throw new Error('Product not found');
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
    const dish: DishRead = {
      id: `dish-${Date.now()}`,
      user_id: 'dev-bypass-user',
      name: data.name,
      kind: data.kind,
      cooked_weight_g: data.cooked_weight_g || null,
      remaining_g: data.remaining_g !== undefined ? data.remaining_g : (data.cooked_weight_g || null),
      cooked_on: data.cooked_on || null,
      fixed_slot: data.fixed_slot || null,
      notes: data.notes || null,
      components: (data.components || []).map((c, idx) => ({
        id: `comp-${Date.now()}-${idx}`,
        dish_id: `dish-${Date.now()}`,
        name: c.name,
        raw_weight_g: c.raw_weight_g,
        cooked_weight_g: c.cooked_weight_g,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDishes.unshift(dish);
    return JSON.parse(JSON.stringify(dish));
  },

  updateDish: async (dishId: string, data: DishUpdate): Promise<DishRead> => {
    const dish = mockDishes.find((d) => d.id === dishId);
    if (dish) {
      Object.assign(dish, data, { updated_at: new Date().toISOString() });
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
      .filter((m) => (m.date === menuDate || !m.date) && !mockDeletedSlots.has(`${menuDate}:${m.slot}`))
      .map((m) => ({ ...m, date: menuDate }));

    for (const m of persisted) {
      deriveMenuState(m);
    }

    // 2. Project profile schedule meals not yet persisted and not deleted
    const persistedSlots = new Set(persisted.map((m) => m.slot.toLowerCase()));
    const projected: MenuRead[] = [];

    for (const pm of mockProfile.meals) {
      const isDeleted = mockDeletedSlots.has(`${menuDate}:${pm.name}`);
      const isPersisted = persistedSlots.has(pm.name.toLowerCase());
      const isUnpinned = mockUnpinnedDaySlots.has(`${menuDate}:${pm.name}`);
      if (!isDeleted && !isPersisted) {
        const activePin = !isUnpinned && mockPinnedMeals.find((p) => p.active && p.slot.toLowerCase() === pm.name.toLowerCase());
        const items: MenuItemRead[] = activePin ? activePin.items.map((pi) => ({
          id: `item-proj-${pi.id}`,
          menu_id: `menu-proj-${pm.name}`,
          dish_id: pi.dish_id,
          product_id: pi.product_id,
          title: pi.title,
          portion_g: pi.portion_g,
          portion_text: pi.portion_text,
          kcal_est: pi.kcal_est,
          kcal_source: pi.kcal_est ? 'user' : null,
          origin: 'manual',
          position: pi.position,
          incomplete: false,
        })) : [];

        const projectedMenu: MenuRead = {
          id: null,
          user_id: 'dev-bypass-user',
          date: menuDate,
          slot: pm.name,
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
      const matchingMenu = allMenus.find((m) => m.slot.toLowerCase() === pm.slot.toLowerCase());
      if (!matchingMenu || !matchingMenu.pinned) {
        availablePins.push({
          slot: pm.slot,
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
      return a.slot.localeCompare(b.slot);
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
    const slotLower = data.slot.trim().toLowerCase();
    const existsPersisted = mockMenus.some(
      (m) => (m.date === menuDate || !m.date) && m.slot.toLowerCase() === slotLower
    );
    const existsProjected = !mockDeletedSlots.has(`${menuDate}:${data.slot}`) &&
      mockProfile.meals.some((pm) => pm.name.toLowerCase() === slotLower);

    if (existsPersisted || existsProjected) {
      throw new ApiError(`Meal «${data.slot}» already exists`, 409);
    }

    mockDeletedSlots.delete(`${menuDate}:${data.slot}`);
    const newMenu: MenuRead = {
      id: `menu-${Date.now()}`,
      user_id: 'dev-bypass-user',
      date: menuDate,
      slot: data.slot.trim(),
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

  deleteMeal: async (menuDate: string, slot: string): Promise<void> => {
    const slotLower = slot.trim().toLowerCase();
    const existing = mockMenus.find(
      (m) => (m.date === menuDate || !m.date) && m.slot.toLowerCase() === slotLower
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
      const activePin = !isUnpinned && mockPinnedMeals.find((p) => p.active && p.slot.toLowerCase() === slotLower);
      if (activePin) {
        mockUnpinnedDaySlots.add(`${menuDate}:${slot}`);
        const pmSchedule = mockProfile.meals.find((p) => p.name.toLowerCase() === slotLower);
        const emptyMenu: MenuRead = {
          id: `menu-${Date.now()}`,
          user_id: 'dev-bypass-user',
          date: menuDate,
          slot: pmSchedule?.name || slot,
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
      (m) => !(m.date === menuDate && m.slot.toLowerCase() === slotLower) &&
             !(m.slot.toLowerCase() === slotLower)
    );
  },

  generateMenu: async (menuDate: string, data: GenerationRequest): Promise<GenerationResultRead> => {
    if (data.scope === 'slot' && data.slot) {
      const slotName = data.slot;
      let slotMenu: MenuRead;
      const existing = mockMenus.find((m) => m.slot.toLowerCase() === slotName.toLowerCase());
      if (existing && existing.status === 'eaten') {
        throw new ApiError(`Прийом «${slotName}» вже зʼїдено (спочатку зніміть позначку «з\'їдено»)`, 409);
      }

      // Simulate two-stage server processing
      await new Promise((resolve) => setTimeout(resolve, 3200));

      if (!existing) {
        slotMenu = {
          id: `menu-${Date.now()}`,
          user_id: 'dev-bypass-user',
          date: menuDate,
          slot: slotName,
          time: mockProfile.meals.find((pm) => pm.name === slotName)?.time || null,
          status: 'planned',
          eaten_at: null,
          regenerations: 0,
          kcal_incomplete: false,
          items: [
            {
              id: `item-${Date.now()}-1`,
              menu_id: `menu-${slotName}`,
              dish_id: slotName === 'Обід' ? 'dish-1' : null,
              product_id: null,
              title: slotName === 'Обід' ? 'Запечена форель з лимоном' : `Збалансована страва для «${slotName}»`,
              portion_g: 250,
              portion_text: null,
              kcal_est: 380,
              kcal_source: 'model',
              origin: 'generated',
              position: 0,
              incomplete: false,
            },
            {
              id: `item-${Date.now()}-2`,
              menu_id: `menu-${slotName}`,
              dish_id: null,
              product_id: 'prod-3',
              title: 'Огірки свіжі',
              portion_g: 150,
              portion_text: null,
              kcal_est: 25,
              kcal_source: 'model',
              origin: 'generated',
              position: 1,
              incomplete: false,
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
            dish_id: slotName === 'Обід' ? 'dish-1' : null,
            product_id: null,
            title: slotName === 'Обід' ? 'Запечена форель з овочами' : `Перерахована страва для «${slotName}» (вар. ${slotMenu.regenerations})`,
            portion_g: 280,
            portion_text: null,
            kcal_est: 410,
            kcal_source: 'model',
            origin: 'generated',
            position: 0,
            incomplete: false,
          },
          {
            id: `item-${Date.now()}-2`,
            menu_id: slotMenu.id,
            dish_id: null,
            product_id: 'prod-3',
            title: 'Салат зі свіжих огірків',
            portion_g: 120,
            portion_text: null,
            kcal_est: 30,
            kcal_source: 'model',
            origin: 'generated',
            position: 1,
            incomplete: false,
          },
        ];
        slotMenu.items = newItems;
      }
      deriveMenuState(slotMenu);

      const dayResult = await mockNutritionApi.getDayMenus(menuDate);
      return {
        menus: dayResult.menus,
        rationale: `Окремо згенеровано прийом «${slotName}» з урахуванням цілей харчування.`,
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
        m.id = `menu-${Date.now()}-${m.slot}`;
      }
      if (m.pinned || m.status === 'eaten') {
        continue;
      }
      m.regenerations += 1;
      const newItems: MenuItemRead[] = [
        {
          id: `item-${Date.now()}-${m.id}-1`,
          menu_id: m.id,
          dish_id: m.slot === 'Обід' ? 'dish-1' : null,
          product_id: null,
          title: `Страва для «${m.slot}» (вар. ${m.regenerations})`,
          portion_g: 250,
          portion_text: null,
          kcal_est: 350,
          kcal_source: 'model',
          origin: 'generated',
          position: 0,
          incomplete: false,
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

  estimateMenu: async (menuDate: string, slot?: string): Promise<DayMenuRead> => {
    const targets = slot ? mockMenus.filter((m) => m.slot === slot) : mockMenus;
    for (const m of targets) {
      for (const it of m.items) {
        if (it.kcal_est === null || it.kcal_est === undefined) {
          it.kcal_est = it.portion_g ? Math.round(it.portion_g * 1.5) : 200;
          it.kcal_source = 'model';
        }
      }
      deriveMenuState(m);
    }
    return mockNutritionApi.getDayMenus(menuDate);
  },

  addMenuItem: async (_menuDate: string, slot: string, data: MenuItemCreate): Promise<MenuItemRead> => {
    const hasKcal = data.kcal_est !== undefined && data.kcal_est !== null;
    let target = mockMenus.find((m) => (m.date === _menuDate || !m.date) && m.slot === slot);
    if (target && target.status === 'eaten') {
      throw new ApiError('Не можна додати позицію до завершеного прийому (спочатку зніміть позначку «з\'їдено»)', 409, {
        detail: 'Не можна додати позицію до завершеного прийому (спочатку зніміть позначку «з\'їдено»)',
      });
    }
    if (!target) {
      const pm = mockProfile.meals.find((p) => p.name === slot);
      target = {
        id: `menu-${Date.now()}`,
        user_id: 'dev-bypass-user',
        date: _menuDate,
        slot: slot,
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

    const newItem: MenuItemRead = {
      id: `item-${Date.now()}`,
      menu_id: target.id || `menu-${slot}`,
      dish_id: data.dish_id || null,
      product_id: data.product_id || null,
      title: data.title || 'Нова страва',
      portion_g: data.portion_g || null,
      portion_text: data.portion_text || null,
      kcal_est: hasKcal ? data.kcal_est! : null,
      kcal_source: hasKcal ? 'user' : null,
      origin: 'manual',
      position: 99,
      incomplete: false,
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
        const prevRef = `${it.dish_id}:${it.product_id}`;
        if (data.dish_id !== undefined) {
          it.dish_id = data.dish_id;
          if (data.dish_id) {
            it.product_id = null;
            it.incomplete = false;
            if (data.title === undefined || data.title === null) {
              const d = mockDishes.find((dish) => dish.id === data.dish_id);
              if (d) it.title = d.name;
            }
          }
        }
        if (data.product_id !== undefined) {
          it.product_id = data.product_id;
          if (data.product_id) {
            it.dish_id = null;
            it.incomplete = false;
            if (data.title === undefined || data.title === null) {
              const p = mockProducts.find((prod) => prod.id === data.product_id);
              if (p) it.title = p.name;
            }
          }
        }
        const refChanged = `${it.dish_id}:${it.product_id}` !== prevRef;
        const titleChanged = data.title !== undefined && data.title !== it.title;
        const portionChanged = (data.portion_g !== undefined && data.portion_g !== it.portion_g) ||
                               (data.portion_text !== undefined && data.portion_text !== it.portion_text);

        if (data.title !== undefined && data.title !== null) it.title = data.title;
        if (data.portion_g !== undefined) it.portion_g = data.portion_g;
        if (data.portion_text !== undefined) it.portion_text = data.portion_text;

        if (data.kcal_est !== undefined) {
          it.kcal_est = data.kcal_est;
          it.kcal_source = data.kcal_est !== null ? 'user' : null;
        } else if (refChanged || titleChanged || portionChanged) {
          if (it.kcal_source === 'model') {
            it.kcal_est = null;
            it.kcal_source = null;
          }
        }

        if (data.position !== undefined) it.position = data.position;
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

  pinMeal: async (menuDate: string, slot: string): Promise<MenuRead> => {
    const slotLower = slot.trim().toLowerCase();
    const pinnedMeal = mockPinnedMeals.find((pm) => pm.slot.toLowerCase() === slotLower);
    if (!pinnedMeal) {
      throw new ApiError(`Закріплений прийом для «${slot}» не знайдено`, 404);
    }

    mockDeletedSlots.delete(`${menuDate}:${slot}`);
    mockUnpinnedDaySlots.delete(`${menuDate}:${slot}`);

    let menu = mockMenus.find(
      (m) => (m.date === menuDate || !m.date) && m.slot.toLowerCase() === slotLower
    );

    if (menu && menu.status === 'eaten') {
      throw new ApiError('Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)', 409, {
        detail: 'Зʼїдений прийом їжі не можна змінювати (спочатку зніміть позначку «з\'їдено»)',
      });
    }

    const pmSchedule = mockProfile.meals.find((p) => p.name.toLowerCase() === slotLower);
    const time = menu?.time || pmSchedule?.time || null;

    const pinnedItems: MenuItemRead[] = pinnedMeal.items.map((pi, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      menu_id: menu?.id || `menu-${slot}`,
      dish_id: pi.dish_id,
      product_id: pi.product_id,
      title: pi.title,
      portion_g: pi.portion_g,
      portion_text: pi.portion_text,
      kcal_est: pi.kcal_est,
      kcal_source: pi.kcal_est ? 'user' : null,
      origin: 'manual',
      position: pi.position,
      incomplete: false,
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
        slot: slot,
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

  upsertPinnedMeal: async (slot: string, data: PinnedMealUpsert): Promise<PinnedMealRead> => {
    const slotTrimmed = slot.trim();
    const inSchedule = mockProfile.meals.some(
      (m) => m.name.toLowerCase() === slotTrimmed.toLowerCase()
    );
    if (!inSchedule) {
      throw new ApiError(`Прийом «${slot}» відсутній у розкладі профілю`, 400);
    }

    for (const item of data.items) {
      if (item.dish_id && item.product_id) {
        throw new ApiError('Позиція не може одночасно посилатися на страву і продукт', 400);
      }
      if (!item.dish_id && !item.product_id && (!item.title || !item.title.trim())) {
        throw new ApiError('Для вільного запису обовʼязкова назва', 400);
      }
    }

    let existing = mockPinnedMeals.find(
      (pm) => pm.slot.toLowerCase() === slotTrimmed.toLowerCase()
    );

    const now = new Date().toISOString();
    const formattedItems: PinnedMealItemRead[] = data.items.map((it, idx) => ({
      id: `pin-item-${Date.now()}-${idx}`,
      dish_id: it.dish_id || null,
      product_id: it.product_id || null,
      title: it.title?.trim() || (it.dish_id ? (mockDishes.find((d) => d.id === it.dish_id)?.name || 'Страва') : (mockProducts.find((p) => p.id === it.product_id)?.name || 'Продукт')),
      portion_g: it.portion_g !== undefined ? it.portion_g : null,
      portion_text: it.portion_text?.trim() || null,
      kcal_est: it.kcal_est !== undefined ? it.kcal_est : null,
      position: it.position ?? idx,
    }));

    if (existing) {
      existing.active = data.active;
      existing.items = formattedItems;
      existing.updated_at = now;
    } else {
      existing = {
        id: `pin-${Date.now()}`,
        slot: slotTrimmed,
        active: data.active,
        items: formattedItems,
        created_at: now,
        updated_at: now,
      };
      mockPinnedMeals.push(existing);
    }

    return JSON.parse(JSON.stringify(existing));
  },

  deletePinnedMeal: async (slot: string): Promise<void> => {
    mockPinnedMeals = mockPinnedMeals.filter(
      (pm) => pm.slot.toLowerCase() !== slot.trim().toLowerCase()
    );
  },
};
