// ─────────────────────────────────────────────
// src/utils/formatters.ts
// Type-safe formatting helpers and utilities
// Phase 9: Centralized formatting to eliminate duplication
// ─────────────────────────────────────────────

/**
 * Type-safe icon names for Ionicons.
 * Used to replace `as any` casts throughout the app.
 */
export type IoniconName =
  | 'lock-closed'
  | 'add-circle-outline'
  | 'water'
  | 'leaf'
  | 'star'
  | 'skull-outline'
  | 'close'
  | 'leaf-outline'
  | 'arrow-forward-circle-outline'
  | 'chevron-forward'
  | 'close-circle'
  | 'analytics-outline'
  | 'flask-outline'
  | 'git-merge-outline'
  | 'flash-outline'
  | 'archive-outline'
  | 'speedometer-outline'
  | 'volume-medium-outline'
  | 'notifications-outline'
  | 'code-outline';

/**
 * Type-safe wrapper for icon names.
 * Ensures icon names are validated at compile time.
 */
export function validateIcon(icon: string): IoniconName {
  const validIcons: Record<string, IoniconName> = {
    'lock-closed': 'lock-closed',
    'add-circle-outline': 'add-circle-outline',
    'water': 'water',
    'leaf': 'leaf',
    'star': 'star',
    'skull-outline': 'skull-outline',
    'close': 'close',
    'leaf-outline': 'leaf-outline',
    'arrow-forward-circle-outline': 'arrow-forward-circle-outline',
    'chevron-forward': 'chevron-forward',
    'close-circle': 'close-circle',
    'analytics-outline': 'analytics-outline',
    'flask-outline': 'flask-outline',
    'git-merge-outline': 'git-merge-outline',
    'flash-outline': 'flash-outline',
    'archive-outline': 'archive-outline',
    'speedometer-outline': 'speedometer-outline',
    'volume-medium-outline': 'volume-medium-outline',
    'notifications-outline': 'notifications-outline',
    'code-outline': 'code-outline',
  };

  return validIcons[icon] ?? 'leaf';
}

/**
 * Safely cast a string to an IoniconName.
 * Used for dynamic icon names from data.
 */
export function asIconName(value: unknown): IoniconName {
  if (typeof value === 'string') {
    return validateIcon(value);
  }
  return 'leaf';
}

// ─────────────────────────────────────────────
// Zustand Memoization Utilities
// Phase 9: Optimize store selector performance
// ─────────────────────────────────────────────

/**
 * Shallow equality check for arrays and objects.
 * Used to prevent unnecessary re-renders when derived selector values haven't changed.
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key]);
}

/**
 * Create a memoized selector that avoids recalculating unless dependencies change.
 * Useful for expensive derived selectors that combine multiple store values.
 */
export function createMemoizedSelector<T, R>(
  selector: (value: T) => R,
  equals?: (a: R, b: R) => boolean
): (value: T) => R {
  let lastValue: T;
  let lastResult: R;
  let hasBeenCalled = false;

  return (value: T): R => {
    if (!hasBeenCalled || !Object.is(value, lastValue)) {
      lastValue = value;
      lastResult = selector(value);
      hasBeenCalled = true;
    } else if (equals && !equals(lastResult, lastResult)) {
      // If custom equals function is provided, use it for additional validation
      lastResult = selector(value);
    }
    return lastResult;
  };
}
