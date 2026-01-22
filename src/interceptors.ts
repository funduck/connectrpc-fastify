import type { Interceptor } from '@connectrpc/connect';
import { MiddlewareContextStore } from './stores';

/**
 * ContextInterceptor - copies context values from MiddlewareContextStore to HandlerContext
 * This interceptor should be first in the chain to ensure context values are available
 * to subsequent interceptors and controllers.
 */
export const contextInterceptor: Interceptor = (next) => async (req) => {
  // Get the request ID from headers
  const requestId = req.header.get('x-server-request-id');

  if (requestId) {
    const middlewareContext = MiddlewareContextStore.get(requestId);

    if (middlewareContext) {
      // Copy context values from middleware context to handler context
      for (const [key, value] of middlewareContext.contextValues.entries()) {
        req.contextValues.set(
          { id: key, defaultValue: undefined } as any,
          value,
        );
      }
    }
  }

  // Continue with the next interceptor or handler
  return await next(req);
};
