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

let mockMenus: MenuRead[] = [
  {
    id: 'menu-1',
    user_id: 'dev-bypass-user',
    date: new Date().toISOString().slice(0, 10),
    slot: 'Сніданок',
    status: 'eaten',
    eaten_at: new Date().toISOString(),
    regenerations: 0,
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
        origin: 'generated',
        position: 0,
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
        origin: 'generated',
        position: 1,
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
    status: 'planned',
    eaten_at: null,
    regenerations: 0,
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
        origin: 'generated',
        position: 0,
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
        origin: 'manual',
        position: 1,
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
    status: 'planned',
    eaten_at: null,
    regenerations: 0,
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
        origin: 'generated',
        position: 0,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockOffPlan: OffPlanEntryRead[] = [];
let mockNotes: MenuNoteRead[] = [];

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
    return {
      date: menuDate,
      menus: JSON.parse(JSON.stringify(mockMenus.map((m) => ({ ...m, date: menuDate })))),
      notes: JSON.parse(JSON.stringify(mockNotes.filter((n) => n.date === menuDate))),
      off_plan: JSON.parse(JSON.stringify(mockOffPlan.filter((e) => e.date === menuDate))),
    };
  },

  updateMenu: async (menuId: string, data: MenuUpdate): Promise<MenuRead> => {
    const menu = mockMenus.find((m) => m.id === menuId);
    if (menu) {
      if (data.status) menu.status = data.status;
      if (data.eaten_at !== undefined) menu.eaten_at = data.eaten_at;
      return JSON.parse(JSON.stringify(menu));
    }
    throw new Error('Menu not found');
  },

  generateMenu: async (menuDate: string, data: GenerationRequest): Promise<GenerationResultRead> => {
    if (data.scope === 'slot' && data.slot) {
      const slotName = data.slot;
      let slotMenu = mockMenus.find((m) => m.slot === slotName);
      if (!slotMenu) {
        slotMenu = {
          id: `menu-${Date.now()}`,
          user_id: 'dev-bypass-user',
          date: menuDate,
          slot: slotName,
          status: 'planned',
          eaten_at: null,
          regenerations: 0,
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
              origin: 'generated',
              position: 0,
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
              origin: 'generated',
              position: 1,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockMenus.push(slotMenu);
      } else {
        slotMenu.regenerations += 1;
        slotMenu.items = [
          {
            id: `item-${Date.now()}-1`,
            menu_id: slotMenu.id,
            dish_id: slotName === 'Обід' ? 'dish-1' : null,
            product_id: null,
            title: slotName === 'Обід' ? 'Запечена форель з овочами' : `Перерахована страва для «${slotName}» (вар. ${slotMenu.regenerations})`,
            portion_g: 280,
            portion_text: null,
            kcal_est: 410,
            origin: 'generated',
            position: 0,
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
            origin: 'generated',
            position: 1,
          },
        ];
      }

      return {
        menus: JSON.parse(JSON.stringify(mockMenus.map((m) => ({ ...m, date: menuDate })))),
        rationale: `Окремо згенеровано прийом «${slotName}» з урахуванням цілей харчування.`,
        shopping_list: ['Свіжа зелень', 'Огірки свіжі'],
      };
    }

    return {
      menus: JSON.parse(JSON.stringify(mockMenus.map((m) => ({ ...m, date: menuDate })))),
      rationale: 'Згенеровано з урахуванням залишку риби в холодильнику та обмеження щодо жирів (без жовчного міхура). Білковий обід і легка вечеря.',
      shopping_list: ['Оливкова олія', 'Сир кисломолочний 5%'],
    };
  },

  addMenuItem: async (_menuDate: string, slot: string, data: MenuItemCreate): Promise<MenuItemRead> => {
    const newItem: MenuItemRead = {
      id: `item-${Date.now()}`,
      menu_id: `menu-${slot}`,
      dish_id: data.dish_id || null,
      product_id: data.product_id || null,
      title: data.title || 'Нова страва',
      portion_g: data.portion_g || null,
      portion_text: data.portion_text || null,
      kcal_est: data.kcal_est || 200,
      origin: 'manual',
      position: 99,
    };
    const target = mockMenus.find((m) => m.slot === slot);
    if (target) {
      target.items.push(newItem);
    }
    return JSON.parse(JSON.stringify(newItem));
  },

  updateMenuItem: async (itemId: string, data: MenuItemUpdate): Promise<MenuItemRead> => {
    for (const m of mockMenus) {
      const it = m.items.find((i) => i.id === itemId);
      if (it) {
        Object.assign(it, data);
        return JSON.parse(JSON.stringify(it));
      }
    }
    throw new Error('Item not found');
  },

  deleteMenuItem: async (itemId: string): Promise<void> => {
    for (const m of mockMenus) {
      m.items = m.items.filter((i) => i.id !== itemId);
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
};
