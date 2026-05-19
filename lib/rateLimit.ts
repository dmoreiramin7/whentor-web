// Client-side free tier — 5 messages per world per day, no signup required
const KEY_PREFIX = 'whentor_msgs_';

function todayKey(worldId: string) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${KEY_PREFIX}${worldId}_${today}`;
}

export const FREE_LIMIT = 5;

export function getMessageCount(worldId: string): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(todayKey(worldId)) ?? '0', 10);
}

export function incrementMessageCount(worldId: string): number {
  if (typeof window === 'undefined') return 0;
  const next = getMessageCount(worldId) + 1;
  localStorage.setItem(todayKey(worldId), String(next));
  return next;
}

export function hasReachedLimit(worldId: string): boolean {
  return getMessageCount(worldId) >= FREE_LIMIT;
}

export function remainingMessages(worldId: string): number {
  return Math.max(0, FREE_LIMIT - getMessageCount(worldId));
}
