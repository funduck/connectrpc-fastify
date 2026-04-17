import { createCustomContextValues } from '../../src/context-values';
import { setLogger } from '../../src/helpers';
import {
  ControllersStore,
  InterceptorStore,
  MiddlewareContextStore,
  MiddlewareStore,
  RouteMetadataStore,
} from '../../src/stores';

describe('Stores', () => {
  beforeAll(() => {
    setLogger(false);
  });

  beforeEach(() => {
    ControllersStore.clear();
    MiddlewareStore.clear();
    InterceptorStore.clear();
    RouteMetadataStore.clear();
    MiddlewareContextStore.clear();
  });

  describe('ControllersStore', () => {
    class TestController {
      constructor() {}
    }

    const mockService = {
      typeName: 'test.Service',
      methods: [],
    } as any;

    it('should register a controller instance', () => {
      const instance = new TestController();
      ControllersStore.registerInstance(instance, mockService);

      const values = ControllersStore.values();
      expect(values).toHaveLength(1);
      expect(values[0].instance).toBe(instance);
      expect(values[0].service).toBe(mockService);
    });

    it('should throw error when registering duplicate controller', () => {
      const instance1 = new TestController();
      const instance2 = new TestController();

      ControllersStore.registerInstance(instance1, mockService);

      expect(() => {
        ControllersStore.registerInstance(instance2, mockService);
      }).toThrow(
        'Controller TestController is already registered! This may happen if you export controller as provider and also register it in some Nest module.',
      );
    });

    it('should clear all controllers', () => {
      const instance = new TestController();
      ControllersStore.registerInstance(instance, mockService);

      ControllersStore.clear();

      const values = ControllersStore.values();
      expect(values).toHaveLength(0);
    });
  });

  describe('MiddlewareStore', () => {
    class TestMiddleware {
      use(req: any, res: any, next: any) {
        next();
      }
    }

    it('should register a middleware instance', () => {
      const instance = new TestMiddleware();
      MiddlewareStore.registerInstance(instance);

      const retrieved = MiddlewareStore.getInstance(TestMiddleware);
      expect(retrieved).toBe(instance);
    });

    it('should throw error when registering duplicate middleware', () => {
      const instance1 = new TestMiddleware();
      const instance2 = new TestMiddleware();

      MiddlewareStore.registerInstance(instance1);

      expect(() => {
        MiddlewareStore.registerInstance(instance2);
      }).toThrow(
        'Middleware TestMiddleware is already registered! This may happen if you export middleware as provider and also register it in some Nest module.',
      );
    });

    it('should return null for non-existent middleware', () => {
      class NonExistentMiddleware {
        use() {}
      }

      const retrieved = MiddlewareStore.getInstance(
        NonExistentMiddleware as any,
      );
      expect(retrieved).toBeNull();
    });

    it('should clear all middlewares', () => {
      const instance = new TestMiddleware();
      MiddlewareStore.registerInstance(instance);

      MiddlewareStore.clear();

      const retrieved = MiddlewareStore.getInstance(TestMiddleware);
      expect(retrieved).toBeNull();
    });
  });

  describe('InterceptorStore', () => {
    class TestInterceptor {
      use(next: any) {
        return async (req: any) => next(req);
      }
    }

    it('should register an interceptor instance', () => {
      const instance = new TestInterceptor();
      InterceptorStore.registerInstance(instance as any);

      const retrieved = InterceptorStore.getInstance(TestInterceptor as any);
      expect(retrieved).toBe(instance);
    });

    it('should throw error when registering duplicate interceptor', () => {
      const instance1 = new TestInterceptor();
      const instance2 = new TestInterceptor();

      InterceptorStore.registerInstance(instance1 as any);

      expect(() => {
        InterceptorStore.registerInstance(instance2 as any);
      }).toThrow(
        'Interceptor TestInterceptor is already registered! This may happen if you export interceptor as provider and also register it in some Nest module.',
      );
    });

    it('should return null for non-existent interceptor', () => {
      class NonExistentInterceptor {
        use() {}
      }

      const retrieved = InterceptorStore.getInstance(
        NonExistentInterceptor as any,
      );
      expect(retrieved).toBeNull();
    });

    it('should clear all interceptors', () => {
      const instance = new TestInterceptor();
      InterceptorStore.registerInstance(instance as any);

      InterceptorStore.clear();

      const retrieved = InterceptorStore.getInstance(TestInterceptor as any);
      expect(retrieved).toBeNull();
    });
  });

  describe('RouteMetadataStore', () => {
    class TestController {
      testMethod() {}
    }

    it('should register route metadata', () => {
      const instance = new TestController();
      const method = instance.testMethod;

      RouteMetadataStore.registerRoute(
        'test.Service',
        'TestMethod',
        TestController,
        method,
        'testMethod',
        instance,
      );

      const metadata = RouteMetadataStore.getRouteMetadata(
        '/test.Service/TestMethod',
      );
      expect(metadata).toBeDefined();
      expect(metadata?.controllerClass).toBe(TestController);
      expect(metadata?.controllerMethod).toBe(method);
      expect(metadata?.controllerMethodName).toBe('testMethod');
      expect(metadata?.instance).toBe(instance);
      expect(metadata?.serviceName).toBe('test.Service');
      expect(metadata?.methodName).toBe('TestMethod');
    });

    it('should return null for non-existent route', () => {
      const metadata =
        RouteMetadataStore.getRouteMetadata('/nonexistent/Route');
      expect(metadata).toBeNull();
    });

    it('should handle URL with query parameters', () => {
      const instance = new TestController();
      const method = instance.testMethod;

      RouteMetadataStore.registerRoute(
        'test.Service',
        'TestMethod',
        TestController,
        method,
        'testMethod',
        instance,
      );

      const metadata = RouteMetadataStore.getRouteMetadata(
        'http://localhost/test.Service/TestMethod?param=value',
      );
      expect(metadata).toBeDefined();
      expect(metadata?.serviceName).toBe('test.Service');
    });

    it('should get all registered routes', () => {
      const instance = new TestController();
      const method = instance.testMethod;

      RouteMetadataStore.registerRoute(
        'test.Service1',
        'Method1',
        TestController,
        method,
        'method1',
        instance,
      );

      RouteMetadataStore.registerRoute(
        'test.Service2',
        'Method2',
        TestController,
        method,
        'method2',
        instance,
      );

      const routes = RouteMetadataStore.getAllRoutes();
      expect(routes).toHaveLength(2);
      expect(routes.map(([key]) => key)).toContain('/test.Service1/Method1');
      expect(routes.map(([key]) => key)).toContain('/test.Service2/Method2');
    });

    it('should clear all routes', () => {
      const instance = new TestController();
      const method = instance.testMethod;

      RouteMetadataStore.registerRoute(
        'test.Service',
        'TestMethod',
        TestController,
        method,
        'testMethod',
        instance,
      );

      RouteMetadataStore.clear();

      const metadata = RouteMetadataStore.getRouteMetadata(
        '/test.Service/TestMethod',
      );
      expect(metadata).toBeNull();
    });
  });

  describe('MiddlewareContextStore', () => {
    it('should store and retrieve middleware context', () => {
      const requestId = 'req_123';
      const contextValues = createCustomContextValues();
      const context = { contextValues };

      MiddlewareContextStore.set(requestId, context);

      const retrieved = MiddlewareContextStore.get(requestId);
      expect(retrieved).toBe(context);
      expect(retrieved?.contextValues).toBe(contextValues);
    });

    it('should return null for non-existent request ID', () => {
      const retrieved = MiddlewareContextStore.get('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should delete middleware context', () => {
      const requestId = 'req_123';
      const contextValues = createCustomContextValues();
      const context = { contextValues };

      MiddlewareContextStore.set(requestId, context);
      MiddlewareContextStore.delete(requestId);

      const retrieved = MiddlewareContextStore.get(requestId);
      expect(retrieved).toBeNull();
    });

    it('should handle multiple contexts', () => {
      const requestId1 = 'req_1';
      const requestId2 = 'req_2';
      const context1 = { contextValues: createCustomContextValues() };
      const context2 = { contextValues: createCustomContextValues() };

      MiddlewareContextStore.set(requestId1, context1);
      MiddlewareContextStore.set(requestId2, context2);

      expect(MiddlewareContextStore.get(requestId1)).toBe(context1);
      expect(MiddlewareContextStore.get(requestId2)).toBe(context2);
    });

    it('should clear all contexts', () => {
      const requestId1 = 'req_1';
      const requestId2 = 'req_2';
      const context1 = { contextValues: createCustomContextValues() };
      const context2 = { contextValues: createCustomContextValues() };

      MiddlewareContextStore.set(requestId1, context1);
      MiddlewareContextStore.set(requestId2, context2);

      MiddlewareContextStore.clear();

      expect(MiddlewareContextStore.get(requestId1)).toBeNull();
      expect(MiddlewareContextStore.get(requestId2)).toBeNull();
    });
  });
});
