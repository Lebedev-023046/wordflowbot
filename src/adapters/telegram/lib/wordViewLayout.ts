const MIN_READY_ITEMS_FOR_FILTERS = 4;

export function shouldShowWordViewFilters(readyItemCount: number): boolean {
  return readyItemCount >= MIN_READY_ITEMS_FOR_FILTERS;
}
