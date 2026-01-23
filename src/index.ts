export function printMsg() {
  console.error(
    'connectrpc-fastify is in development mode! not ready for production yet!',
  );
}

export { ConnectRPC } from './connectrpc';

export {
  CustomContextValues,
  controllerClassContextKey,
  controllerMethodContextKey,
  createCustomContextValues,
} from './context-values';

export { interceptorConfig, middlewareConfig } from './interfaces';

export type {
  AnyFn,
  Interceptor,
  Logger,
  Middleware,
  MiddlewareConfig,
  MiddlewareConfigUnion,
  Service,
} from './interfaces';

export type { OmitConnectrpcFields } from './types';

export { getCustomContextValues } from './middlewares';
