import { ConnectRPC } from '../../src';
import { setLogger } from '../../src/helpers';
import { RouteConfigGlobal, RouteConfigService } from '../../src/interfaces';
import { buildRouteConfigChecker } from '../../src/route-config-checker';
import { ElizaService } from '../demo/gen/connectrpc/eliza/v1/eliza_pb';
import { setupControllerWithoutServer } from './test-helpers';

describe('Route config checker', () => {
  beforeAll(() => {
    setLogger(false);
    ConnectRPC.clear();
    setupControllerWithoutServer();
  });

  afterAll(() => {
    ConnectRPC.clear();
  });

  describe('Global config matching', () => {
    it('should match global config to all routes', () => {
      const globalConfig: RouteConfigGlobal = {};

      const checker = buildRouteConfigChecker([globalConfig]);

      // Global config should match all routes
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');
      const listenManyRoute = checker(
        '/connectrpc.eliza.v1.ElizaService/ListenMany',
      );

      expect(sayRoute).toHaveLength(1);
      expect(sayRoute[0]).toBe(globalConfig);

      expect(sayManyRoute).toHaveLength(1);
      expect(sayManyRoute[0]).toBe(globalConfig);

      expect(listenManyRoute).toHaveLength(1);
      expect(listenManyRoute[0]).toBe(globalConfig);
    });

    it('should match multiple global configs to all routes', () => {
      const globalConfig1: RouteConfigGlobal = {};
      const globalConfig2: RouteConfigGlobal = {};

      const checker = buildRouteConfigChecker([globalConfig1, globalConfig2]);

      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');

      expect(sayRoute).toHaveLength(2);
      expect(sayRoute).toContain(globalConfig1);
      expect(sayRoute).toContain(globalConfig2);
    });
  });

  describe('Service-level config matching', () => {
    it('should match service config to all methods of that service', () => {
      const serviceConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
      };

      const checker = buildRouteConfigChecker([serviceConfig]);

      // Should match all methods of ElizaService
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');
      const listenManyRoute = checker(
        '/connectrpc.eliza.v1.ElizaService/ListenMany',
      );

      expect(sayRoute).toHaveLength(1);
      expect(sayRoute[0]).toBe(serviceConfig);

      expect(sayManyRoute).toHaveLength(1);
      expect(sayManyRoute[0]).toBe(serviceConfig);

      expect(listenManyRoute).toHaveLength(1);
      expect(listenManyRoute[0]).toBe(serviceConfig);
    });

    it('should not match service config to routes from different services', () => {
      const serviceConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
      };

      const checker = buildRouteConfigChecker([serviceConfig]);

      // Should not match routes from other services
      const otherServiceRoute = checker(
        '/other.service.v1.OtherService/Method',
      );

      expect(otherServiceRoute).toHaveLength(0);
    });
  });

  describe('Service + method-level config matching', () => {
    it('should match method-specific config only to specified methods', () => {
      const methodConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: ['say'],
      };

      const checker = buildRouteConfigChecker([methodConfig]);

      // Should match only the 'say' method
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      expect(sayRoute).toHaveLength(1);
      expect(sayRoute[0]).toBe(methodConfig);

      // Should not match other methods
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');
      expect(sayManyRoute).toHaveLength(0);
    });

    it('should match config to multiple specified methods', () => {
      const methodConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: ['say', 'sayMany'],
      };

      const checker = buildRouteConfigChecker([methodConfig]);

      // Should match specified methods
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');

      expect(sayRoute).toHaveLength(1);
      expect(sayRoute[0]).toBe(methodConfig);

      expect(sayManyRoute).toHaveLength(1);
      expect(sayManyRoute[0]).toBe(methodConfig);

      // Should not match other methods
      const listenManyRoute = checker(
        '/connectrpc.eliza.v1.ElizaService/ListenMany',
      );
      expect(listenManyRoute).toHaveLength(0);
    });

    it('should not match config with empty methods array', () => {
      const methodConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: [],
      };

      const checker = buildRouteConfigChecker([methodConfig]);

      // Should match all methods when methods array is empty
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');

      expect(sayRoute).toHaveLength(1);
      expect(sayManyRoute).toHaveLength(1);
    });
  });

  describe('Mixed config matching', () => {
    it('should match multiple applicable configs to a single route', () => {
      const globalConfig: RouteConfigGlobal = { on: undefined };
      const serviceConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
      };
      const methodConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: ['say'],
      };

      const checker = buildRouteConfigChecker([
        globalConfig,
        serviceConfig,
        methodConfig,
      ]);

      // Say route should match all three configs
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      expect(sayRoute).toHaveLength(3);
      expect(sayRoute).toContain(globalConfig);
      expect(sayRoute).toContain(serviceConfig);
      expect(sayRoute).toContain(methodConfig);

      // SayMany route should match only global and service configs
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');
      expect(sayManyRoute).toHaveLength(2);
      expect(sayManyRoute).toContain(globalConfig);
      expect(sayManyRoute).toContain(serviceConfig);
      expect(sayManyRoute).not.toContain(methodConfig);
    });

    it('should handle multiple method-specific configs', () => {
      const methodConfig1: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: ['say'],
      };
      const methodConfig2: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: ['say', 'sayMany'],
      };

      const checker = buildRouteConfigChecker([methodConfig1, methodConfig2]);

      // Say route should match both configs
      const sayRoute = checker('/connectrpc.eliza.v1.ElizaService/Say');
      expect(sayRoute).toHaveLength(2);
      expect(sayRoute).toContain(methodConfig1);
      expect(sayRoute).toContain(methodConfig2);

      // SayMany route should match only the second config
      const sayManyRoute = checker('/connectrpc.eliza.v1.ElizaService/SayMany');
      expect(sayManyRoute).toHaveLength(1);
      expect(sayManyRoute).toContain(methodConfig2);
      expect(sayManyRoute).not.toContain(methodConfig1);
    });
  });

  describe('checkConfig parameter', () => {
    it('should filter results by specific config when checkConfig is provided', () => {
      const globalConfig: RouteConfigGlobal = { on: undefined };
      const serviceConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
      };

      const checker = buildRouteConfigChecker([globalConfig, serviceConfig]);

      // Check for specific config
      const sayWithGlobal = checker(
        '/connectrpc.eliza.v1.ElizaService/Say',
        globalConfig,
      );
      const sayWithService = checker(
        '/connectrpc.eliza.v1.ElizaService/Say',
        serviceConfig,
      );

      expect(sayWithGlobal).toHaveLength(1);
      expect(sayWithGlobal[0]).toBe(globalConfig);

      expect(sayWithService).toHaveLength(1);
      expect(sayWithService[0]).toBe(serviceConfig);
    });

    it('should return empty array when checkConfig is not matched', () => {
      const globalConfig: RouteConfigGlobal = { on: undefined };
      const serviceConfig: RouteConfigService<typeof ElizaService> = {
        on: ElizaService,
        methods: ['sayMany'], // Not 'say'
      };

      // Create a checker with both configs
      const checker = buildRouteConfigChecker([globalConfig, serviceConfig]);

      // Check for service config on 'Say' route - should not match because sayMany is specified
      const result = checker(
        '/connectrpc.eliza.v1.ElizaService/Say',
        serviceConfig,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('Non-existent routes', () => {
    it('should return empty array for non-existent routes', () => {
      const globalConfig: RouteConfigGlobal = { on: undefined };
      const checker = buildRouteConfigChecker([globalConfig]);

      const result = checker('/non.existent.Service/Method');

      expect(result).toHaveLength(0);
    });

    it('should handle invalid route paths gracefully', () => {
      const globalConfig: RouteConfigGlobal = { on: undefined };
      const checker = buildRouteConfigChecker([globalConfig]);

      const result1 = checker('invalid-path');
      const result2 = checker('');
      const result3 = checker('/');

      expect(result1).toHaveLength(0);
      expect(result2).toHaveLength(0);
      expect(result3).toHaveLength(0);
    });
  });
});
