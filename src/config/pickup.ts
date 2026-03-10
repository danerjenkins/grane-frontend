import { parseAppDate } from '../utils/dates';

export const PICKUP_WINDOW_LABEL = '9:00 AM – 5:00 PM';
export const PICKUP_WINDOW_NON_SATURDAY_LABEL = '5:00 PM – 9:00 PM';
export const PICKUP_LOCATION_LABEL = '311 E 200 S, Provo, Utah, 84606';
export const PICKUP_HELP_TEXT = 'Home pickup is how Grane keeps bread fresh and ordering simple.';

export function formatBakeDay(dateString?: string | null): string {
  if (!dateString) return 'your selected bake day';

  const date = parseAppDate(dateString);
  if (!date) return 'your selected bake day';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function getPickupWindowLabel(dateString?: string | null): string {
  if (!dateString) return PICKUP_WINDOW_LABEL;

  const date = parseAppDate(dateString);
  if (!date) return PICKUP_WINDOW_LABEL;

  const isSaturday = date.getDay() === 6;
  return isSaturday ? PICKUP_WINDOW_LABEL : PICKUP_WINDOW_NON_SATURDAY_LABEL;
}
