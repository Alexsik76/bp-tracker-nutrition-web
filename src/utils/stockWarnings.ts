import { useToastStore } from '../stores/toast';
import type { StockWarning } from '../types/nutrition';

export function notifyStockWarnings(warnings?: StockWarning[] | null): void {
  if (!warnings || warnings.length === 0) return;
  const details = warnings
    .map((w) => `${w.product_name} (${w.missing_g} г)`)
    .join(', ');
  const toastStore = useToastStore();
  toastStore.show(`Бракує: ${details}`, 'warning');
}
