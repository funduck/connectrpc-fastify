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
import { ControllersStore, InterceptorStore, MiddlewareStore } from './stores';

class ConnectRPCClass {
  setLogger(customLogger: Logger | false) {
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

  /**
   * Configure interceptors for ConnectRPC routes.
   * The order of interceptors matters - they will be applied in the order they are provided.
   *
   * For type safety use `interceptorConfig` helper from './interfaces'.
   *
   * Should be called before `registerFastifyPlugin`.
   */
  initInterceptors(configs: InterceptorConfigUnion[]) {
    initInterceptors(configs);
  }

  registerFastifyPlugin(server: FastifyInstance) {
    return registerFastifyPlugin(server);
  }

  /**
   * Configure and initialize middlewares for ConnectRPC routes.
   * The order of middlewares matters - they will be applied in the order they are provided.
   *
   * For type safety use `middlewareConfig` helper from './interfaces'.
   *
   * Should be called after `registerFastifyPlugin`.
   */
  initMiddlewares(
    server: FastifyInstance,
    middlewareConfigs: MiddlewareConfigUnion[],
  ) {
    return initMiddlewares(server, middlewareConfigs);
  }

  async init(
    server: FastifyInstance,
    options: {
      logger?: Logger | false;
      interceptors?: InterceptorConfigUnion[];
      middlewares?: MiddlewareConfigUnion[];
    },
  ) {
    if (options.logger != null) {
      this.setLogger(options.logger);
    }
    if (options.interceptors) {
      this.initInterceptors(options.interceptors);
    }
    await this.registerFastifyPlugin(server);
    if (options.middlewares) {
      this.initMiddlewares(server, options.middlewares);
    }
  }
}

/**
 * Main ConnectRPC class to manage registration of controllers and middlewares
 */
export const ConnectRPC = new ConnectRPCClass();
