export type ProductAvailability = 'in_stock' | 'low' | 'out';
export type ProductPreference = 'preferred' | 'neutral' | 'avoid';

export interface ProductRead {
  id: string;
  user_id: string;
  name: string;
  availability: ProductAvailability;
  preference: ProductPreference;
  eat_raw: boolean;
  count: number | null;
  daily_limit_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  availability?: ProductAvailability;
  preference?: ProductPreference;
  eat_raw?: boolean;
  count?: number | null;
  daily_limit_g?: number | null;
}

export interface ProductUpdate {
  name?: string;
  availability?: ProductAvailability;
  preference?: ProductPreference;
  eat_raw?: boolean;
  count?: number | null;
  daily_limit_g?: number | null;
}

export type DishKind = 'ready' | 'constant';

export interface DishComponentBase {
  name: string;
  raw_weight_g?: number | null;
  cooked_weight_g?: number | null;
}

export interface DishComponentRead extends DishComponentBase {
  id: string;
  dish_id: string;
}

export interface DishComponentCreate extends DishComponentBase {}

export interface DishRead {
  id: string;
  user_id: string;
  name: string;
  kind: DishKind;
  cooked_weight_g: number | null;
  remaining_g: number | null;
  cooked_on: string | null;
  fixed_slot: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  components: DishComponentRead[];
}

export interface DishCreate {
  name: string;
  kind: DishKind;
  cooked_weight_g?: number | null;
  remaining_g?: number | null;
  cooked_on?: string | null;
  fixed_slot?: string | null;
  notes?: string | null;
  components?: DishComponentCreate[];
}

export interface DishUpdate {
  name?: string;
  cooked_weight_g?: number | null;
  remaining_g?: number | null;
  cooked_on?: string | null;
  fixed_slot?: string | null;
  notes?: string | null;
  components?: DishComponentCreate[];
}

export type MenuItemOrigin = 'generated' | 'manual';
export type MenuStatus = 'planned' | 'incomplete' | 'eaten' | 'skipped';

export interface MenuItemRead {
  id: string;
  menu_id: string;
  dish_id: string | null;
  product_id: string | null;
  title: string;
  portion_g: number | null;
  portion_text: string | null;
  kcal_est: number | null;
  origin: MenuItemOrigin;
  position: number;
}

export interface MenuItemCreate {
  dish_id?: string | null;
  product_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  kcal_est?: number | null;
  position?: number;
}

export interface MenuItemUpdate {
  dish_id?: string | null;
  product_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  kcal_est?: number | null;
  position?: number;
}

export interface MenuRead {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  slot: string; // "Сніданок", "Обід", "Вечеря", etc.
  status: MenuStatus;
  eaten_at: string | null;
  regenerations: number;
  created_at: string;
  updated_at: string;
  items: MenuItemRead[];
}

export interface MenuUpdate {
  status?: MenuStatus;
  eaten_at?: string | null;
}

export interface GenerationRequest {
  scope: 'day' | 'slot';
  slot?: string | null;
}

export interface GenerationResultRead {
  menus: MenuRead[];
  rationale: string;
  shopping_list: string[];
}

export interface MealSchedule {
  name: string;
  time: string; // HH:MM
}

export interface NutritionProfileUpsert {
  sex: 'male' | 'female';
  birth_year: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  pace_kg_per_week: number;
  restrictions: string | null;
  dislikes: string | null;
  meals: MealSchedule[];
}

export interface NutritionProfileRead extends NutritionProfileUpsert {
  user_id: string;
  updated_at: string;
}

export interface OffPlanEntryRead {
  id: string;
  user_id: string;
  date: string;
  at: string;
  text: string;
  kcal_est: number | null;
}

export interface OffPlanEntryCreate {
  date: string;
  at: string; // ISO datetime
  text: string;
  kcal_est?: number | null;
}

export type MenuNoteKind = 'info' | 'correction';

export interface MenuNoteRead {
  id: string;
  user_id: string;
  date: string;
  kind: MenuNoteKind;
  text: string;
  answer: string | null;
  created_at: string;
}

export interface MenuNoteCreate {
  kind: MenuNoteKind;
  text: string;
}
