import { AsyncLocalStorage as NodeAsyncLocalStorage } from 'node:async_hooks';

/**
 * Wrapper around nodejs:AsyncLocalStorage.
 * It allows running function in context and retrieve its awaitable result.
 * Also it helps tracking places where async context is created.
 */
export class AsyncLocalStorage extends NodeAsyncLocalStorage<Map<string, any>> {
  /**
   * Runs in context and clears it when exits.
   */
  runAsync<Result>(
    store: Map<string, any>,
    callback: () => Promise<Result>,
  ): Promise<Result> {
    return new Promise((resolve, reject) => {
      super.run(store, async () => {
        callback()
          .then(resolve, reject)
          .finally(() => {
            store.clear();
          });
      });
    });
  }
}

export const ContextStorage = new AsyncLocalStorage();
