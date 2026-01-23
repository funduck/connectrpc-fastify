import type { Interceptor } from '@connectrpc/connect';
import {
  controllerClassContextKey,
  controllerMethodContextKey,
} from './context-values';
import { buildRouteConfigChecker, getURLPath, logger } from './helpers';
import { InterceptorConfigUnion } from './interfaces';
import { xServerRequestIdHeader } from './middlewares';
import {
  InterceptorStore,
  MiddlewareContextStore,
  RouteMetadataStore,
} from './stores';

/**
 * ContextInterceptor - copies context values from MiddlewareContextStore to HandlerContext
 * This interceptor should be first in the chain to ensure context values are available
 * to subsequent interceptors and controllers.
 */
export const contextInterceptor: Interceptor = (next) => async (req) => {
  // Get the request ID from headers
  const requestId = req.header.get(xServerRequestIdHeader);

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

  const meta = RouteMetadataStore.getRouteMetadata(req.url);
  if (meta) {
    // Set controller class and method in context values, so interceptors can access them
    req.contextValues.set(controllerClassContextKey, meta.controllerClass);
    req.contextValues.set(controllerMethodContextKey, meta.controllerMethod);
  }

  // Continue with the next interceptor or handler
  return await next(req);
};

/** Here we store the initialized interceptors after configuration */
export let initializedInterceptors: Interceptor[] = [];

export function initInterceptors(configs: InterceptorConfigUnion[]) {
  const routeChecker = buildRouteConfigChecker(configs);
  initializedInterceptors = [];

  for (const config of configs) {
    const interceptorInstance = InterceptorStore.getInstance(config.use);

    if (!interceptorInstance) {
      logger.error(
        `Interceptor ${config.use.name} not registered. Make sure to decorate it with @Interceptor().`,
      );
      process.exit(1);
    }

    // Create the interceptor function that checks route configs before applying
    const interceptor: Interceptor = (next) => async (req) => {
      const configsForUrl = routeChecker(getURLPath(req.url), config);
      const shouldApply = configsForUrl.length > 0;
      if (shouldApply) {
        return await interceptorInstance.use(next)(req);
      } else {
        return await next(req);
      }
    };

    initializedInterceptors.push(interceptor);

    const serviceInfo = config.on
      ? ` to service ${config.on.typeName}`
      : ' to all services';
    const methodInfo = config.methods
      ? ` methods [${config.methods.join(', ')}]`
      : ' all methods';
    logger.log(
      `Registered interceptor: ${config.use.name}${serviceInfo}${methodInfo}`,
    );
  }
}
