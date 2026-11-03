export interface NutritionSet {
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
}

export interface ProductRead {
  id: string;
  user_id: string;
  name: string;
  available: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  available?: boolean;
  note?: string | null;
}

export interface ProductUpdate {
  name?: string;
  available?: boolean;
  note?: string | null;
}

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'morning_snack'
  | 'afternoon_snack'
  | 'evening_snack';

export interface NewProductInput {
  name: string;
  available?: boolean;
  note?: string | null;
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

export interface DishBase {
  name: string;
  is_ready?: boolean;
  pinned_meal_type?: MealType | null;
  nutrition_overridden?: boolean;
  note?: string | null;
  cooked_weight_g?: number | null;
}

export interface DishRead extends DishBase, NutritionSet {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  components: DishComponentRead[];
}

export interface DishCreate extends Partial<NutritionSet> {
  name: string;
  is_ready?: boolean;
  pinned_meal_type?: MealType | null;
  nutrition_overridden?: boolean;
  note?: string | null;
  cooked_weight_g?: number | null;
  components?: DishComponentCreate[];
}

export interface DishUpdate extends Partial<NutritionSet> {
  name?: string;
  is_ready?: boolean | null;
  pinned_meal_type?: MealType | null;
  nutrition_overridden?: boolean | null;
  note?: string | null;
  cooked_weight_g?: number | null;
  components?: DishComponentCreate[];
  reset_nutrition?: boolean;
}

export type MenuOrigin = 'suggestion' | 'manual' | 'pinned';
export type MenuState = 'suggestion' | 'eaten';
export type MenuItemOrigin = 'generated' | 'manual';
export type NutritionSource = 'user' | 'model' | 'computed';

export interface MealEvaluationRead {
  key?: string;
  criterion_key: string;
  choice: string;
  level: string; // 'green' | 'yellow' | 'red' | 'uncertain'
}

export interface MenuEvaluationRead {
  key: string;
  title: string;
  level: string; // 'green' | 'yellow' | 'red' | 'uncertain'
  confidence: number;
  criteria_version: number;
  evaluated_at: string;
  menu_id?: string | null;
}

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
  created_at?: string;
  updated_at: string;
}

export interface MenuItemCreate extends Partial<NutritionSet> {
  dish_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  nutrition_source?: NutritionSource | null;
  origin?: MenuItemOrigin;
  position?: number;
}

export interface MenuItemUpdate extends Partial<NutritionSet> {
  dish_id?: string | null;
  title?: string | null;
  portion_g?: number | null;
  portion_text?: string | null;
  nutrition_source?: NutritionSource | null;
  position?: number | null;
}

export interface MenuRead {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  origin: MenuOrigin;
  state: MenuState;
  eaten_at: string | null;
  pinned_dish_id?: string | null;
  created_at: string;
  updated_at: string;
  items: MenuItemRead[];
  evaluations?: MealEvaluationRead[];
}

export type SuggestionMode = 'suggest' | 'log';

export interface SuggestionRequest {
  text: string | null;
  date: string; // YYYY-MM-DD
  at: string; // ISO with timezone offset
  mode?: SuggestionMode;
}

export interface SuggestionResponse {
  mode: SuggestionMode;
  menu: MenuRead;
}

export interface EatMealRequest {
  date: string; // YYYY-MM-DD
  at: string; // ISO with timezone offset
}

export interface JournalTotals {
  kcal: number;
  protein_g: number;
}

export interface JournalNorms {
  kcal: number | null;
  protein_g: number | null;
}

export interface JournalResponse {
  date: string;
  meals: MenuRead[];
  suggestion: MenuRead | null;
  totals: JournalTotals;
  norms: JournalNorms | null;
  day_evaluations: MenuEvaluationRead[];
}

export interface NutritionProfileUpsert {
  sex: 'male' | 'female';
  birth_year: number;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  pace_kg_per_week: number;
  restrictions?: string | null;
  dislikes?: string | null;
  weight_variety?: number;
  weight_balance?: number;
  weight_goal?: number;
}

export interface NutritionProfileRead extends NutritionProfileUpsert {
  user_id: string;
  updated_at: string;
}
