/**
 * Collection Utilities
 *
 * Size-limited Set and Map implementations to prevent memory leaks.
 */

/**
 * Create a size-limited Set that automatically removes oldest entries
 */
export class SizeLimitedSet<T> extends Set<T> {
  constructor(private maxSize: number) {
    super();
  }

  add(value: T): this {
    if (this.size >= this.maxSize) {
      const first = this.values().next().value;
      if (first !== undefined) {
        this.delete(first);
      }
    }
    return super.add(value);
  }
}

/**
 * Create a size-limited Map that automatically removes oldest entries
 */
export class SizeLimitedMap<K, V> extends Map<K, V> {
  constructor(private maxSize: number) {
    super();
  }

  set(key: K, value: V): this {
    if (this.size >= this.maxSize) {
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }
    return super.set(key, value);
  }
}
