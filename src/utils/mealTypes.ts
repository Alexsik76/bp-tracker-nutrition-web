import type { MealType } from '../types/nutrition';

export interface MealTypeOption {
  value: MealType;
  label: string;
}

// Canonical order of meal types throughout the UI.
export const MEAL_TYPES: readonly MealTypeOption[] = [
  { value: 'breakfast', label: 'Сніданок' },
  { value: 'morning_snack', label: 'Перекус уранці' },
  { value: 'lunch', label: 'Обід' },
  { value: 'afternoon_snack', label: 'Перекус удень' },
  { value: 'dinner', label: 'Вечеря' },
  { value: 'evening_snack', label: 'Перекус увечері' },
];

const LABELS: Record<MealType, string> = Object.fromEntries(
  MEAL_TYPES.map((m) => [m.value, m.label]),
) as Record<MealType, string>;

export function mealTypeLabel(type: MealType | null | undefined): string {
  return type ? LABELS[type] ?? type : '';
}

export function mealTypeOrder(type: MealType): number {
  return MEAL_TYPES.findIndex((m) => m.value === type);
}
