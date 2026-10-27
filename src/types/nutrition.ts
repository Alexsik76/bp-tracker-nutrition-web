export type ProductAvailability = 'in_stock' | 'low' | 'out';
export type ProductPreference = 'preferred' | 'neutral' | 'avoid';

export interface NutritionSet {
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
}

export interface ProductRead extends NutritionSet {
  id: string;
  user_id: string;
  name: string;
  availability: ProductAvailability;
  preference: ProductPreference;
  eat_raw: boolean;
  count: number | null;
  stock_g: number | null;
  reserved_g: number | null;
  available_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate extends Partial<NutritionSet> {
  name: string;
  availability?: ProductAvailability;
  preference?: ProductPreference;
  eat_raw?: boolean;
  count?: number | null;
  stock_g?: number | null;
}

export interface ProductUpdate extends Partial<NutritionSet> {
  name?: string;
  availability?: ProductAvailability;
  preference?: ProductPreference;
  eat_raw?: boolean;
  count?: number | null;
  stock_g?: number | null;
}

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'morning_snack'
  | 'afternoon_snack'
  | 'evening_snack';

export type DishKind = 'ready' | 'constant';

export interface NewProductInput {
  name: string;
  stock_g?: number | null;
}

export interface DishComponentBase {
  product_id: string;
  weight_g: number;
}

export interface DishComponentRead extends DishComponentBase {
  id: string;
  dish_id: string;
}

export interface DishComponentCreate {
  product_id?: string | null;
  new_product?: NewProductInput | null;
  weight_g: number;
}

export interface DishRead extends NutritionSet {
  id: string;
  user_id: string;
  name: string;
  kind: DishKind;
  cooked_weight_g: number | null;
  remaining_g: number | null;
  cooked_on: string | null;
  fixed_meal_type: MealType | null;
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
  fixed_meal_type?: MealType | null;
  notes?: string | null;
  components?: DishComponentCreate[];
}

export interface DishUpdate {
  name?: string;
  cooked_weight_g?: number | null;
  remaining_g?: number | null;
  cooked_on?: string | null;
  fixed_meal_type?: MealType | null;
  notes?: string | null;
  components?: DishComponentCreate[];
}

export type MenuItemOrigin = 'generated' | 'manual';
export type MenuStatus = 'planned' | 'incomplete' | 'eaten';
export type NutritionSource = 'user' | 'model' | 'computed';

export interface MenuItemRead extends NutritionSet {
  id: string;
  menu_id: string;
  dish_id: string | null;
  title: string;
  portion_g: number | null;
  portion_text: string | null;
  nutrition_source: NutritionSource | null;
  origin: MenuItemOrigin;
  position: number;
  incomplete: boolean;
  updated_at: string;
}

export interface MenuItemCreate extends Partial<NutritionSet> {
  dish_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  position?: number;
}

export interface MenuItemUpdate extends Partial<NutritionSet> {
  dish_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  position?: number;
}

export interface MenuRead {
  id: string | null;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  time: string | null; // "HH:MM"
  status: MenuStatus;
  eaten_at: string | null;
  regenerations: number;
  kcal_incomplete: boolean;
  pinned?: boolean;
  created_at: string;
  updated_at: string;
  items: MenuItemRead[];
}

export interface MealCreate {
  meal_type: MealType;
  time: string; // HH:MM
}

export interface MenuUpdate {
  eaten_at: string | null;
}

export interface GenerationRequest {
  scope: 'day' | 'slot';
  meal_type?: MealType | null;
}

export interface GenerationResultRead {
  menus: MenuRead[];
  rationale: string;
  shopping_list: string[];
}

export interface MealSchedule {
  type: MealType;
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

export interface AvailablePin {
  meal_type: MealType;
  pinned_meal_id: string;
}

export interface DayMenuRead {
  date: string;
  menus: MenuRead[];
  notes: MenuNoteRead[];
  off_plan: OffPlanEntryRead[];
  kcal_incomplete: boolean;
  can_generate_day: boolean;
  day_generation_replaces_manual: boolean;
  available_pins?: AvailablePin[];
}

export interface PinnedMealItemRead extends NutritionSet {
  id: string;
  pinned_meal_id: string;
  dish_id: string | null;
  title: string;
  portion_g: number | null;
  portion_text: string | null;
  position: number;
}

export interface PinnedMealItemUpsert extends Partial<NutritionSet> {
  dish_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  position?: number;
}

export interface PinnedMealRead {
  id: string;
  meal_type: MealType;
  active: boolean;
  items: PinnedMealItemRead[];
  created_at: string;
  updated_at: string;
}

export interface PinnedMealUpsert {
  active: boolean;
  items: PinnedMealItemUpsert[];
}
