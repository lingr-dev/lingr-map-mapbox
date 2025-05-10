/**
 * Asserts that a value is not null or undefined.
 * @param value - The value to check.
 * @param message - Optional error message to throw if the value is null/undefined.
 * @throws {Error} If the value is null or undefined.
 */
export function assertIsSome<T>(value: T, message: string = 'value is None'): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Calls the `destroy` method on an object if it exists, then sets the reference to null.
 * @param obj - The object to destroy (or null/undefined).
 * @returns Always returns null.
 */
export function destroyMaybe(obj: any): null {
  obj?.destroy();
  return null;
}

/**
 * Calls the `dispose` method on an object if it exists, then sets the reference to null.
 * @param obj - The object to dispose (or null/undefined).
 * @returns Always returns null.
 */
export function disposeMaybe(obj: any): null {
  obj?.dispose();
  return null;
}

/**
 * Calls the `remove` method on an object if it exists, then sets the reference to null.
 * @param obj - The object to remove (or null/undefined).
 * @returns Always returns null.
 */
export function removeMaybe(obj: any): null {
  obj?.remove();
  return null;
}

/**
 * Calls the `abort` method on an object if it exists, then sets the reference to null.
 * @param obj - The object to abort (or null/undefined).
 * @returns Always returns null.
 */
export function abortMaybe(obj: any): null {
  obj?.abort();
  return null;
}

/**
 * Calls the `release` method on an object if it exists, then sets the reference to null.
 * @param obj - The object to release (or null/undefined).
 * @returns Always returns null.
 */
export function releaseMaybe(obj: any): null {
  obj?.release();
  return null;
}

/**
 * Compares two values for equality, using a custom comparator if provided.
 * For objects with an `equals` method, it uses that method unless a custom comparator is specified.
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @param comparator - Optional custom comparison function.
 * @returns True if the values are considered equal, false otherwise.
 */
export function equalsMaybe<T>(a: T, b: T, comparator?: (_a: T, _b: T) => boolean): boolean {
  if (a !== null && a !== undefined && b !== null && b !== undefined) {
    return comparator ? comparator(a, b) : typeof (a as any).equals === 'function' ? (a as any).equals(b) : a === b;
  }
  return a === b;
}

/**
 * Safely accesses a property of an object if it exists.
 * @param obj - The object to access (or null/undefined).
 * @param property - The name of the property to access.
 * @returns The value of the property, or undefined if the object is null/undefined.
 */
export function maybeProperty<T extends object, K extends keyof T>(
  obj: T | null | undefined,
  property: K
): T[K] | undefined {
  return obj?.[property];
}

/**
 * Finds the first element in an array that satisfies a condition,
 * and transforms it using a mapper function.
 * @param array - The array to search.
 * @param callback - A function that takes an element and its index,
 *                   and returns a transformed value or undefined.
 * @returns The first transformed value that is not undefined, or undefined if none found.
 */
export function mappedFind<T, U>(array: T[], callback: (_element: T, _index: number) => U | undefined): U | undefined {
  for (let i = 0; i < array.length; i++) {
    const result = callback(array[i], i);
    if (result !== undefined) {
      return result;
    }
  }
  return undefined;
}
