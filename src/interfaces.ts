import type { GenMessage, GenService } from '@bufbuild/protobuf/codegenv2';
import {
  HandlerContext,
  StreamRequest,
  StreamResponse,
  UnaryRequest,
  UnaryResponse,
} from '@connectrpc/connect';
import { FastifyReply, FastifyRequest } from 'fastify';
import { OmitConnectrpcFields } from './types';

export interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  verbose: (...args: any[]) => void;
}

export interface Middleware {
  use(
    req: FastifyRequest['raw'],
    res: FastifyReply['raw'],
    next: (err?: any) => void,
  ): void;
}

/**
 * Copy-paste from @connectrpc/connect Interceptor types
 *
 * AnyFn represents the client-side invocation of an RPC. Interceptors can wrap
 * this invocation, add request headers, and wrap parts of the request or
 * response to inspect and log.
 */
export type AnyFn = (
  req: UnaryRequest | StreamRequest,
) => Promise<UnaryResponse | StreamResponse>;

export interface Interceptor {
  use(next: AnyFn): AnyFn;
}

export interface Type<T = any> extends Function {
  new (...args: any[]): T;
}

/**
 * Extract the input type from a method schema
 */
type ExtractInput<T> = T extends { input: GenMessage<infer M> } ? M : never;

/**
 * Extract the output type from a method schema
 */
type ExtractOutput<T> = T extends { output: GenMessage<infer M> } ? M : never;

/**
 * Convert a service method to a controller method signature
 *
 * Note: The context parameter receives a HandlerContext instance at runtime
 * which provides access to headers, values, signal, and other request metadata.
 */
type ServiceMethod<T> = T extends { methodKind: 'unary' }
  ? (
      request: ExtractInput<T>,
      context?: HandlerContext,
    ) => Promise<OmitConnectrpcFields<ExtractOutput<T>>>
  : T extends { methodKind: 'server_streaming' }
    ? (
        request: ExtractInput<T>,
        context?: HandlerContext,
      ) => AsyncIterable<OmitConnectrpcFields<ExtractOutput<T>>>
    : T extends { methodKind: 'client_streaming' }
      ? (
          request: AsyncIterable<ExtractInput<T>>,
          context?: HandlerContext,
        ) => Promise<OmitConnectrpcFields<ExtractOutput<T>>>
      : T extends { methodKind: 'bidi_streaming' }
        ? (
            request: AsyncIterable<ExtractInput<T>>,
            context?: HandlerContext,
          ) => AsyncIterable<OmitConnectrpcFields<ExtractOutput<T>>>
        : never;

/**
 * Generic interface that maps a ConnectRPC service to controller methods
 *
 * Controllers can implement any subset of the service methods.
 * TypeScript will enforce correct signatures for implemented methods.
 *
 * Usage:
 * ```typescript
 * export class ElizaController implements Service<typeof ElizaService> {
 *   constructor() {
 *     ConnectRPC.registerController(this, ElizaService);
 *   }
 *
 *   async say(request: SayRequest): Promise<SayResponse> {
 *     // implementation
 *   }
 *   // Other methods are optional
 * }
 * ```
 */
export type Service<T> =
  T extends GenService<infer Methods>
    ? {
        [K in keyof Methods]?: ServiceMethod<Methods[K]>;
      }
    : never;

export type ServiceMethodNames<T> =
  T extends GenService<infer Methods>
    ? {
        [K in keyof Methods]: K;
      }[keyof Methods]
    : never;

export type RouteConfigGlobal = {
  /**
   * Middleware applies to all services and all methods
   */
  on?: never;
  methods?: never;
};

export type RouteConfigService<T extends GenService<any>> = {
  /**
   * The service to apply middleware to
   */
  on: T;

  /**
   * Optional: Specific method names to apply middleware to.
   * If omitted, middleware applies to all methods of the service.
   * Method names should match the protobuf method names (e.g., 'say', 'sayMany')
   */
  methods?: Array<ServiceMethodNames<T>>;
};

/**
 * Middleware configuration for ConnectRPC routes - without service specified
 */
export type MiddlewareConfigGlobal = {
  /**
   * The middleware class to apply (must be decorated with @Middleware())
   */
  use: Type<Middleware>;
} & RouteConfigGlobal;

/**
 * Middleware configuration for ConnectRPC routes - with service specified
 */
export type MiddlewareConfig<T extends GenService<any>> = {
  /**
   * The middleware class to apply (must be decorated with @Middleware())
   */
  use: Type<Middleware>;
} & RouteConfigService<T>;

/**
 * Middleware configuration for ConnectRPC routes
 */
export type MiddlewareConfigUnion =
  | MiddlewareConfigGlobal
  | MiddlewareConfig<any>;

/**
 * Helper function to create a type-safe middleware configuration
 * This ensures proper type inference for method names based on the service
 */
export function middlewareConfig<T extends GenService<any>>(
  use: Type<Middleware>,
  on?: T,
  methods?: Array<ServiceMethodNames<T>>,
): MiddlewareConfigUnion {
  return {
    use,
    on,
    methods,
  };
}

export type InterceptorConfigGlobal = {
  /**
   * The interceptor class to apply (must be decorated with @Interceptor())
   */
  use: Type<Interceptor>;
} & RouteConfigGlobal;

export type InterceptorConfig<T extends GenService<any>> = {
  /**
   * The interceptor class to apply (must be decorated with @Interceptor())
   */
  use: Type<Interceptor>;
} & RouteConfigService<T>;

/**
 * Interceptor configuration for ConnectRPC routes
 */
export type InterceptorConfigUnion =
  | InterceptorConfigGlobal
  | InterceptorConfig<any>;

/**
 * Helper function to create a type-safe interceptor configuration
 * This ensures proper type inference for method names based on the service
 */
export function interceptorConfig<T extends GenService<any>>(
  use: Type<Interceptor>,
  on?: T,
  methods?: Array<ServiceMethodNames<T>>,
): InterceptorConfigUnion {
  return {
    use,
    on,
    methods,
  };
}
