/**
 * Minnesota PPD schedules use a combined values formula:
 * Combined(A,B) = A + B * (1 - A), where A and B are decimals (0..1).
 *
 * Equivalent multi-combine:
 * 1 - Π (1 - p_i)
 */
export function combinePercents(percents) {
  const ps = (percents || []).filter((n) => typeof n === 'number' && !Number.isNaN(n) && n > 0).map((p) => p / 100);
  if (ps.length === 0) return 0;
  let prod = 1;
  for (const p of ps) prod *= (1 - p);
  const combined = 1 - prod;
  return clamp(combined * 100, 0, 100);
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function round(n, digits = 1) {
  const m = Math.pow(10, digits);
  return Math.round((n + Number.EPSILON) * m) / m;
}
