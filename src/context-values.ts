import { ContextKey, ContextValues } from '@connectrpc/connect';

/**
 * Custom ContextValues implementation that extends the standard ConnectRPC ContextValues
 * with an entries() method to iterate over key-value pairs.
 */
export class CustomContextValues implements ContextValues {
  private values = new Map<symbol, unknown>();

  /**
   * Get a context value by key
   */
  get<T>(key: ContextKey<T>): T {
    if (this.values.has(key.id)) {
      return this.values.get(key.id) as T;
    }
    return key.defaultValue;
  }

  /**
   * Set a context value by key
   */
  set<T>(key: ContextKey<T>, value: T): this {
    this.values.set(key.id, value);
    return this;
  }

  /**
   * Delete a context value by key
   */
  delete(key: ContextKey<unknown>): this {
    this.values.delete(key.id);
    return this;
  }

  /**
   * Iterate over all key-value pairs in the context
   * Returns an iterator of [ContextKey, value] pairs
   */
  *entries(): IterableIterator<[symbol, unknown]> {
    for (const [id, value] of this.values.entries()) {
      yield [id, value];
    }
  }
}

/**
 * Create a new CustomContextValues instance
 */
export function createCustomContextValues(): CustomContextValues {
  return new CustomContextValues();
}
