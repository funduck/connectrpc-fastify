import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { FastifyInstance } from 'fastify';
import { isStrictMode, setStrictMode } from './config';
import { initControllers } from './controllers';
import { registerFastifyPlugin } from './fastify-plugin';
import { setLogger } from './helpers';
import { initInterceptors } from './interceptors';
import {
  Interceptor,
  InterceptorConfigUnion,
  Logger,
  Middleware,
  MiddlewareConfigUnion,
  Service,
} from './interfaces';
import { initMiddlewares } from './middlewares';
import {
  ControllersStore,
  InterceptorStore,
  MiddlewareStore,
  RouteMetadataStore,
} from './stores';

class ConnectRPCClass {
  setLogger(customLogger: Logger | boolean) {
    setLogger(customLogger);
  }

  setStrictMode(isStrict: boolean) {
    setStrictMode(isStrict);
  }

  get isStrictMode() {
    return isStrictMode;
  }

  /** Should be called in middleware constructor */
  registerMiddleware(self: Middleware) {
    MiddlewareStore.registerInstance(self);
  }

  /** Should be called in interceptor constructor */
  registerInterceptor(self: Interceptor) {
    InterceptorStore.registerInstance(self);
  }

  /** Should be called in controller constructor */
  registerController<T extends GenServiceMethods>(
    self: Service<GenService<T>>,
    service: GenService<T>,
  ) {
    ControllersStore.registerInstance(self, service);
  }

  /** Initialize ConnectRPC with controllers, interceptors, Fastify plugin, and middlewares */
  async init(
    server: FastifyInstance,
    options?: {
      logger?: Logger | false;
      interceptors?: InterceptorConfigUnion[];
      middlewares?: MiddlewareConfigUnion[];
    },
  ) {
    if (options?.logger != null) {
      this.setLogger(options.logger);
    }
    this.initControllers();
    if (options?.interceptors) {
      this.initInterceptors(options.interceptors);
    }
    await this.registerFastifyPlugin(server);
    if (options?.middlewares) {
      this.initMiddlewares(server, options.middlewares);
    }
  }

  /** Clear all registered controllers, routes, middlewares, and interceptors, reset strict mode. Useful for testing */
  clear() {
    ControllersStore.clear();
    RouteMetadataStore.clear();
    MiddlewareStore.clear();
    InterceptorStore.clear();
    setStrictMode(false);
  }

  /** Initialize controllers. Should be called before initInterceptors because they need registered routes. */
  initControllers() {
    initControllers();
  }

  /** Initialize interceptors. Should be called after initControllers because needs registered routes. */
  initInterceptors(configs: InterceptorConfigUnion[]) {
    initInterceptors(configs);
  }

  /** Register Fastify plugin. Requires initialized server, controllers and interceptors. */
  registerFastifyPlugin(server: FastifyInstance) {
    return registerFastifyPlugin(server);
  }

  /** Initialize middlewares. Should be called after registerFastifyPlugin because requires initialized server with registered plugin */
  initMiddlewares(
    server: FastifyInstance,
    middlewareConfigs: MiddlewareConfigUnion[],
  ) {
    return initMiddlewares(server, middlewareConfigs);
  }
}

/**
 * Main ConnectRPC class to manage registration of controllers and middlewares
 */
export const ConnectRPC = new ConnectRPCClass();
