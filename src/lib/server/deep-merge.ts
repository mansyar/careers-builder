/**
 * Deep merge utility — performs a structured deep merge of `source` into `target`.
 *
 * - Nested objects in `source` are recursively merged into nested objects in `target`.
 * - Arrays in `source` replace (not merge) arrays in `target`.
 * - Primitive values in `source` overwrite values in `target`.
 * - Returns a new object — does not mutate inputs.
 * - Handles null/undefined gracefully without throwing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge(target: any, source: any): any {
  if (source === null || source === undefined) {
    return target;
  }

  if (target === null || target === undefined) {
    return source;
  }

  if (typeof target !== 'object' || typeof source !== 'object') {
    return source;
  }

  if (Array.isArray(target) || Array.isArray(source)) {
    return source;
  }

  const output: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (
      targetVal !== null &&
      targetVal !== undefined &&
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof targetVal === 'object' &&
      typeof sourceVal === 'object' &&
      !Array.isArray(targetVal) &&
      !Array.isArray(sourceVal)
    ) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  }

  return output;
}
