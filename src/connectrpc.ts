import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { FastifyInstance } from 'fastify';
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

  /** Should be called in middleware constructor */
  registerMiddleware(
    self: Middleware,
    options?: {
      allowMultipleInstances?: boolean;
    },
  ) {
    MiddlewareStore.registerInstance(self, options);
  }

  /** Should be called in interceptor constructor */
  registerInterceptor(
    self: Interceptor,
    options?: {
      allowMultipleInstances?: boolean;
    },
  ) {
    InterceptorStore.registerInstance(self, options);
  }

  /** Should be called in controller constructor */
  registerController<T extends GenServiceMethods>(
    self: Service<GenService<T>>,
    service: GenService<T>,
    options?: {
      allowMultipleInstances?: boolean;
    },
  ) {
    ControllersStore.registerInstance(self, service, options);
  }

  /** Initialize ConnectRPC with interceptors, Fastify plugin, and middlewares */
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
    if (options?.interceptors) {
      this.initInterceptors(options.interceptors);
    }
    await this.registerFastifyPlugin(server);
    if (options?.middlewares) {
      this.initMiddlewares(server, options.middlewares);
    }
  }

  /** Clear all registered controllers, routes, middlewares, and interceptors. Useful for testing */
  clear() {
    ControllersStore.clear();
    RouteMetadataStore.clear();
    MiddlewareStore.clear();
    InterceptorStore.clear();
  }

  initInterceptors(configs: InterceptorConfigUnion[]) {
    initInterceptors(configs);
  }

  registerFastifyPlugin(server: FastifyInstance) {
    return registerFastifyPlugin(server);
  }

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
