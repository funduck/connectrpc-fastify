export function printMsg() {
  console.error(
    'connectrpc-fastify is in development mode! not ready for production yet!',
  );
}

export { ConnectRPC } from './connectrpc';

export { middlewareConfig } from './interfaces';

export type {
  ExecutionContext,
  Guard,
  Logger,
  Middleware,
  MiddlewareConfig,
  MiddlewareConfigUnion,
  Service,
} from './interfaces';

export { initGuards } from './guards';

export type { OmitConnectrpcFields } from './types';
