export function printMsg() {
  console.error(
    'connectrpc-fastify is in development mode! not ready for production yet!',
  );
}

export { ConnectRPC } from './connectrpc';

export {
  CustomContextValues,
  createCustomContextValues,
} from './context-values';

export { middlewareConfig } from './interfaces';

export type {
  Logger,
  Middleware,
  MiddlewareConfig,
  MiddlewareConfigUnion,
  Service,
} from './interfaces';

export type { OmitConnectrpcFields } from './types';

export { getCustomContextValues } from './middlewares';
