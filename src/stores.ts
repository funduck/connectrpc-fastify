import { GenService, GenServiceMethods } from '@bufbuild/protobuf/codegenv2';
import { CustomContextValues } from './context-values';
import { getURLPath } from './helpers';
import { Interceptor, Middleware, Service, Type } from './interfaces';

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

  // For testing purposes
  clear() {
    this.controllers.clear();
  }

  registerInstance<T extends GenServiceMethods>(
    self: Service<GenService<T>>,
    service: GenService<T>,
  ) {
    const controllerClass = self.constructor as Type<any>;
    if (this.controllers.has(controllerClass)) {
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

  // For testing purposes
  clear() {
    this.middlewares.clear();
  }

  /**
   * Register a middleware instance from its constructor
   */
  registerInstance(self: Middleware) {
    const middlewareClass = self.constructor as Type<Middleware>;
    if (this.middlewares.has(middlewareClass)) {
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

  // For testing purposes
  clear() {
    this.routes.clear();
  }

  /**
   * Register route metadata for a specific service method
   * @param serviceName - The full service name (e.g., "connectrpc.eliza.v1.ElizaService")
   * @param methodName - The method name in PascalCase (e.g., "Say")
   * @param controllerClass - The controller class
   * @param controllerMethod - The bound controller method
   * @param controllerMethodName - The name of the controller method (e.g., "say")
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
    return this.routes.get(getURLPath(urlPath)) || null;
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
 * Middleware context - contains both raw req/res and context values
 */
export interface MiddlewareContext {
  contextValues: CustomContextValues;
}

/**
 * Store for middleware context - maps request IDs to middleware context
 * This allows interceptors to access both raw request/response objects and context values
 */
class MiddlewareContextStoreClass {
  private contexts = new Map<string, MiddlewareContext>();

  // For testing purposes
  clear() {
    this.contexts.clear();
  }

  /**
   * Store middleware context by request ID
   */
  set(requestId: string, context: MiddlewareContext) {
    this.contexts.set(requestId, context);
  }

  /**
   * Get middleware context by request ID
   */
  get(requestId: string): MiddlewareContext | null {
    return this.contexts.get(requestId) || null;
  }

  /**
   * Delete middleware context by request ID
   */
  delete(requestId: string) {
    this.contexts.delete(requestId);
  }
}

export const MiddlewareContextStore = new MiddlewareContextStoreClass();

class InterceptorStoreClass {
  private interceptors = new Map<string, any>();

  // For testing purposes
  clear() {
    this.interceptors.clear();
  }

  /**
   * Register an interceptor instance by a unique key
   */
  registerInstance(self: Interceptor) {
    const interceptorClass = self.constructor as Type<Interceptor>;
    const key = interceptorClass.name;
    if (this.interceptors.has(key)) {
      throw new Error(
        `Interceptor ${interceptorClass.name} is already registered! This may happen if you export interceptor as provider and also register it in some Nest module.`,
      );
    }
    this.interceptors.set(key, self);
  }

  /**
   * Get an interceptor instance by its unique key
   */
  getInstance(interceptorClass: Type<Interceptor>): Interceptor | null {
    const key = interceptorClass.name;
    return this.interceptors.get(key) || null;
  }
}

export const InterceptorStore = new InterceptorStoreClass();
