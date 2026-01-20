import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { FastifyInstance } from 'fastify';
import { registerFastifyPlugin } from './fastify-plugin';
import { initGuards } from './guards';
import { setLogger } from './helpers';
import {
  Guard,
  Logger,
  Middleware,
  MiddlewareConfigUnion,
  Service,
} from './interfaces';
import { initMiddlewares } from './middlewares';
import { ControllersStore, GuardsStore, MiddlewareStore } from './stores';

class ConnectRPCClass {
  setLogger(customLogger: Logger) {
    setLogger(customLogger);
  }

  registerMiddleware(
    self: Middleware,
    options?: {
      allowMultipleInstances?: boolean;
    },
  ) {
    MiddlewareStore.registerInstance(self, options);
  }

  /**
   * @param self - instance of controller
   * @param service - generated service that is implemented by controller
   */
  registerController<T extends GenServiceMethods>(
    self: Service<GenService<T>>,
    service: GenService<T>,
    options?: {
      allowMultipleInstances?: boolean;
    },
  ) {
    ControllersStore.registerInstance(self, service, options);
  }

  registerGuard(
    self: Guard,
    options?: {
      allowMultipleInstances?: boolean;
    },
  ) {
    GuardsStore.registerInstance(self, options);
  }

  registerFastifyPlugin(server: FastifyInstance) {
    return registerFastifyPlugin(server);
  }

  private _middlewaresInitialized = false;

  initMiddlewares(
    server: FastifyInstance,
    middlewareConfigs: MiddlewareConfigUnion[],
  ) {
    if (this._middlewaresInitialized) {
      throw new Error('Middlewares have already been initialized!');
    }
    if (this._guardsInitialized) {
      throw new Error('Middlewares must be initialized before guards!');
    }
    this._middlewaresInitialized = true;
    return initMiddlewares(server, middlewareConfigs);
  }

  private _guardsInitialized = false;

  initGuards(server: FastifyInstance) {
    if (this._guardsInitialized) {
      throw new Error('Guards have already been initialized!');
    }
    this._guardsInitialized = true;
    return initGuards(server);
  }
}

/**
 * Main ConnectRPC class to manage registration of controllers and middlewares
 */
export const ConnectRPC = new ConnectRPCClass();
