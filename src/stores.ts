import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { Guard, Middleware, Service, Type } from './interfaces';

class ControllersStoreClass {
  private controllers = new Map<
    Type<any>,
    {
      instance: any;
      service: GenService<any>;
    }
  >();

  values() {
    return Array.from(this.controllers.entries()).map(([target, data]) => ({
      target,
      ...data,
    }));
  }

  registerInstance<T extends GenServiceMethods>(
    self: Service<GenService<T>>,
    service: GenService<T>,
    {
      allowMultipleInstances = false,
    }: {
      allowMultipleInstances?: boolean;
    } = {},
  ) {
    const controllerClass = self.constructor as Type<any>;
    if (!allowMultipleInstances && this.controllers.has(controllerClass)) {
      throw new Error(
        `Controller ${controllerClass.name} is already registered! This may happen if you export controller as provider and also register it in some Nest module.`,
      );
    }
    this.controllers.set(controllerClass, {
      instance: self,
      service,
    });
  }
}

export const ControllersStore = new ControllersStoreClass();

/**
 * Store for middleware classes and their instances
 */
class MiddlewareStoreClass {
  private middlewares = new Map<Type<Middleware>, Middleware>();

  /**
   * Register a middleware instance from its constructor
   */
  registerInstance(
    self: Middleware,
    {
      allowMultipleInstances = false,
    }: {
      allowMultipleInstances?: boolean;
    } = {},
  ) {
    const middlewareClass = self.constructor as Type<Middleware>;
    if (!allowMultipleInstances && this.middlewares.has(middlewareClass)) {
      throw new Error(
        `Middleware ${middlewareClass.name} is already registered! This may happen if you export middleware as provider and also register it in some Nest module.`,
      );
    }
    this.middlewares.set(middlewareClass, self);
  }

  /**
   * Get a middleware instance by its class
   */
  getInstance(middlewareClass: Type<Middleware>): Middleware | null {
    return this.middlewares.get(middlewareClass) || null;
  }
}

export const MiddlewareStore = new MiddlewareStoreClass();

/**
 * Store for route metadata - maps URL paths to controller class and method info
 */
class RouteMetadataStoreClass {
  private routes = new Map<
    string,
    {
      controllerClass: Type<any>;
      controllerMethod: Function;
      controllerMethodName: string;
      instance: any;
      serviceName: string;
      methodName: string;
    }
  >();

  /**
   * Register route metadata for a specific service method
   * @param serviceName - The full service name (e.g., "connectrpc.eliza.v1.ElizaService")
   * @param methodName - The method name in PascalCase (e.g., "Say")
   * @param controllerClass - The controller class
   * @param controllerMethod - The bound controller method
   * @param controllerMethodName - The name of the controller method
   * @param instance - The controller instance
   */
  registerRoute(
    serviceName: string,
    methodName: string,
    controllerClass: Type<any>,
    controllerMethod: Function,
    controllerMethodName: string,
    instance: any,
  ) {
    const routeKey = `/${serviceName}/${methodName}`;
    this.routes.set(routeKey, {
      controllerClass,
      controllerMethod,
      controllerMethodName,
      instance,
      serviceName,
      methodName,
    });
  }

  /**
   * Get route metadata by URL path
   */
  getRouteMetadata(urlPath: string) {
    return this.routes.get(urlPath) || null;
  }

  /**
   * Get all registered routes
   */
  getAllRoutes() {
    return Array.from(this.routes.entries());
  }
}

export const RouteMetadataStore = new RouteMetadataStoreClass();

/**
 * Store for guard classes and their instances
 */
class GuardsStoreClass {
  private guards = new Map<Type<Guard>, Guard>();

  /**
   * Register a guard instance from its constructor
   */
  registerInstance(
    self: Guard,
    {
      allowMultipleInstances = false,
    }: { allowMultipleInstances?: boolean } = {},
  ) {
    const guardClass = self.constructor as Type<Guard>;
    if (!allowMultipleInstances && this.guards.has(guardClass)) {
      throw new Error(
        `Guard ${guardClass.name} is already registered! This may happen if you export guard as provider and also register it in some Nest module.`,
      );
    }
    this.guards.set(guardClass, self);
  }

  /**
   * Get a guard instance by its class
   */
  getInstance(guardClass: Type<Guard>): Guard | null {
    return this.guards.get(guardClass) || null;
  }

  /**
   * Get all registered guards
   */
  getAllGuards(): Guard[] {
    return Array.from(this.guards.values());
  }
}

export const GuardsStore = new GuardsStoreClass();
