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
  available?: boolean;
  note?: string | null;
  availability: ProductAvailability;
  preference: ProductPreference;
  eat_raw: boolean;
  count: number | null;
  stock_g: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate extends Partial<NutritionSet> {
  name: string;
  available?: boolean;
  note?: string | null;
  availability?: ProductAvailability;
  preference?: ProductPreference;
  eat_raw?: boolean;
  count?: number | null;
  stock_g?: number | null;
}

export interface ProductUpdate extends Partial<NutritionSet> {
  name?: string;
  available?: boolean;
  note?: string | null;
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

export interface NewProductInput {
  name: string;
  available?: boolean;
  note?: string | null;
  stock_g?: number | null;
}

export interface NewRecipeInput {
  name: string;
}

export interface RecipeRead {
  id: string;
  user_id: string;
  name: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  product_ids: string[];
}

export interface RecipeCreate {
  name: string;
  product_ids?: string[];
}

export interface RecipeUpdate {
  name?: string;
  archived?: boolean;
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
}

export interface DishRead extends DishBase, NutritionSet {
  id: string;
  user_id: string;
  recipe_id?: string;
  cooked_weight_g?: number;
  remaining_g?: number;
  cooked_on?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  components: DishComponentRead[];
}

export interface DishCreate extends Partial<NutritionSet> {
  name?: string;
  recipe_id?: string | null;
  new_recipe?: NewRecipeInput | null;
  cooked_weight_g?: number;
  remaining_g?: number | null;
  cooked_on?: string | null;
  notes?: string | null;
  note?: string | null;
  is_ready?: boolean;
  pinned_meal_type?: MealType | null;
  nutrition_overridden?: boolean;
  components?: DishComponentCreate[];
}

export interface DishUpdate extends Partial<NutritionSet> {
  name?: string;
  cooked_weight_g?: number | null;
  remaining_g?: number | null;
  cooked_on?: string | null;
  notes?: string | null;
  note?: string | null;
  is_ready?: boolean | null;
  pinned_meal_type?: MealType | null;
  nutrition_overridden?: boolean | null;
  components?: DishComponentCreate[];
}

export interface FrequentDishComponentBase {
  product_id: string;
  weight_g: number;
}

export interface FrequentDishComponentRead extends FrequentDishComponentBase {
  id: string;
  frequent_dish_id: string;
}

export interface FrequentDishComponentCreate {
  product_id?: string | null;
  new_product?: NewProductInput | null;
  weight_g: number;
}

export interface FrequentDishRead extends NutritionSet {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_name: string;
  cooked_weight_g: number;
  nutrition_overridden: boolean;
  created_at: string;
  updated_at: string;
  components: FrequentDishComponentRead[];
}

export interface FrequentDishCreate extends Partial<NutritionSet> {
  recipe_id: string;
  cooked_weight_g: number;
  components?: FrequentDishComponentCreate[];
}

export interface FrequentDishUpdate extends Partial<NutritionSet> {
  recipe_id?: string;
  cooked_weight_g?: number;
  components?: FrequentDishComponentCreate[];
  reset_nutrition?: boolean;
}

export interface FrequentDishCookRequest {
  cooked_on: string; // YYYY-MM-DD
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

export interface SuggestionRequest {
  text: string | null;
  date: string; // YYYY-MM-DD
  at: string; // ISO with timezone offset
}

export interface SuggestionResponse {
  intent: 'suggest' | 'log';
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
