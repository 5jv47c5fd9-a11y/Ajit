const LIMITS = { free: 5, pro: 500, enterprise: Infinity };
const counters = new Map(); // userId -> { month, count }

function currentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

export function canSearch(user) {
  const key = user?.id || 'anon';
  const tier = user?.tier || 'free';
  const limit = LIMITS[tier] ?? LIMITS.free;
  const entry = counters.get(key);
  if (!entry || entry.month !== currentMonth()) return true;
  return entry.count < limit;
}

export function recordSearch(user) {
  const key = user?.id || 'anon';
  const month = currentMonth();
  const entry = counters.get(key);
  if (!entry || entry.month !== month) counters.set(key, { month, count: 1 });
  else entry.count += 1;
}

export function quotaStatus(user) {
  const key = user?.id || 'anon';
  const tier = user?.tier || 'free';
  const entry = counters.get(key);
  return {
    tier,
    limit: LIMITS[tier],
    used: entry && entry.month === currentMonth() ? entry.count : 0,
  };
}
