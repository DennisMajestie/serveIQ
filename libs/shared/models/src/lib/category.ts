/**
 * Normalize and group free-text menu categories so that case, surrounding
 * whitespace and hyphen/underscore-vs-space differences collapse to a single
 * group (e.g. "Starter " and "starter " are the same as "Starter";
 * "Main-course" and "Main Course" are the same "Main Course").
 */

/** Stable grouping key for a category value. */
export function normalizeCategory(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase().replace(/[\s_\-]+/g, ' ');
}

/** Human-friendly single-space label for a category value. */
export function displayCategory(value: string | null | undefined): string {
  return (value || '').trim().replace(/[\s_\-]+/g, ' ').replace(/ +/g, ' ');
}

/**
 * Dedupe category values by their normalized key, keeping the first-seen
 * display spelling and preserving input order.
 */
export function groupCategoryNames(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of values || []) {
    if (v == null) continue;
    const key = normalizeCategory(v);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(displayCategory(v));
  }
  return result;
}
